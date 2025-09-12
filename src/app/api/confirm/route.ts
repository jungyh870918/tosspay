// app/api/confirm/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/db/prisma";
import { getTossSecretKey } from "@/lib/tossKeys"; // 🔑 서버 전용 유틸(시크릿 맵 파싱)

export async function POST(req: NextRequest) {
    try {
        const { paymentKey, orderId, amount, from } = await req.json();

        // 기본 검증
        if (!paymentKey || !orderId || !Number.isFinite(amount)) {
            return Response.json({ message: "invalid params" }, { status: 400 });
        }
        if (!from || typeof from !== "string") {
            return Response.json(
                { message: "missing 'from' (subdomain) param" },
                { status: 400 }
            );
        }

        // 🗺️ 서브도메인별 시크릿키 로드
        const secretKey = getTossSecretKey(from);
        if (!secretKey) {
            return Response.json(
                { message: `secret key not found for subdomain '${from}'` },
                { status: 400 }
            );
        }

        console.log("Confirming payment:", { orderId, amount, from });

        // 🔍 토큰 유효성 검증
        const token = await prisma.payLinkToken.findUnique({
            where: { orderId },
            select: {
                id: true,
                used: true,
                amount: true,
                expiresAt: true,
                orderName: true,
                orderItems: true,
            },
        });

        if (!token) {
            return Response.json({ message: "token not found" }, { status: 404 });
        }
        if (token.used) {
            return Response.json(
                { message: "already used", code: "ALREADY_USED" },
                { status: 409 }
            );
        }
        if (token.expiresAt < new Date()) {
            return Response.json(
                { message: "expired", code: "EXPIRED" },
                { status: 410 }
            );
        }
        if (token.amount !== amount) {
            return Response.json(
                { message: "amount mismatch", code: "AMOUNT_MISMATCH" },
                { status: 409 }
            );
        }

        // ✅ Toss 승인 API 호출 (서브도메인별 시크릿키 사용)
        const url = "https://api.tosspayments.com/v1/payments/confirm";
        const basic = Buffer.from(`${secretKey}:`).toString("base64");

        const tossRes = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Basic ${basic}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ paymentKey, orderId, amount }),
        });

        const json = await tossRes.json();
        if (!tossRes.ok) {
            // 토스 응답 그대로 전달
            return Response.json(json, { status: 400 });
        }

        // 🔒 토큰 소모 처리
        await prisma.payLinkToken.update({
            where: { orderId },
            data: { used: true, usedAt: new Date() },
        });

        // 📨 성공 응답
        return Response.json({
            ok: true,
            orderId: json.orderId,
            approvedAt: json.approvedAt,
            totalAmount: json.totalAmount,
            orderName: token.orderName,
            orderItems: token.orderItems,
        });
    } catch (e: any) {
        return Response.json(
            { message: e?.message ?? "server error" },
            { status: 500 }
        );
    }
}
