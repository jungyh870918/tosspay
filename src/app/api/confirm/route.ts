// app/api/confirm/route.ts
import { NextRequest } from 'next/server';
import { prisma } from '@/db/prisma';

export async function POST(req: NextRequest) {
    try {
        const { paymentKey, orderId, amount } = await req.json();

        if (!paymentKey || !orderId || !Number.isFinite(amount)) {
            return Response.json({ message: 'invalid params' }, { status: 400 });
        }

        console.log('Confirming payment:', { paymentKey, orderId, amount });
        // 🔍 토큰 레코드 유효성 검증
        const token = await prisma.payLinkToken.findUnique({
            where: { orderId: orderId },
            select: {
                id: true,
                used: true,
                amount: true,
                expiresAt: true,
                orderName: true,
                orderItems: true,
            },
        });
        console.log('Found token:', token);
        if (!token)
            return Response.json({ message: 'token not found' }, { status: 404 });
        if (token.used)
            return Response.json(
                { message: 'already used', code: 'ALREADY_USED' },
                { status: 409 },
            );
        if (token.expiresAt < new Date())
            return Response.json(
                { message: 'expired', code: 'EXPIRED' },
                { status: 410 },
            );
        if (token.amount !== amount)
            return Response.json(
                { message: 'amount mismatch', code: 'AMOUNT_MISMATCH' },
                { status: 409 },
            );

        // ✅ Toss 승인 API 호출
        const url = 'https://api.tosspayments.com/v1/payments/confirm';
        const secretKey = process.env.TOSS_SECRET_KEY!;
        const basic = Buffer.from(`${secretKey}:`).toString('base64');

        const tossRes = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Basic ${basic}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ paymentKey, orderId, amount }),
        });

        const json = await tossRes.json();

        if (!tossRes.ok) return Response.json(json, { status: 400 });

        console.log('Toss Payments confirm response:', json);
        // 🔒 토큰 소모 처리
        await prisma.payLinkToken.update({
            where: { orderId: orderId },
            data: { used: true, usedAt: new Date() },
        });

        console.log('Token marked as used:', orderId);
        // 📨 응답: 토스 승인 + DB 정보 함께 반환
        // const saveRes = await fetch('/api/payments/save-finished', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({
        //         orderId,
        //         paymentKey,
        //         detail: json,
        //     }),
        // });

        // if (!saveRes.ok) {
        //     console.error('❌ 결제 정보 저장 실패:', await saveRes.text());
        // }

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
            { message: e?.message ?? 'server error' },
            { status: 500 },
        );
    }
}
