// app/api/paytoken/issue/route.ts
import { NextRequest } from 'next/server';
import { createPlainToken, hashToken } from '@/lib/paylink';
import { prisma } from '@/db/prisma';

export async function POST(req: NextRequest) {
    const { amount, orderName, orderId, orderItems, ttlMinutes = 30 } = await req.json();

    console.log('POST /api/paytoken/issue', { amount, orderName, orderId, orderItems, ttlMinutes });

    if (!Number.isFinite(amount) || amount <= 0 || !orderName || !orderId) {
        return Response.json({ ok: false, message: 'invalid params' }, { status: 400 });
    }

    // 토큰 생성 및 해시 저장
    const token = createPlainToken();
    const tokenHash = hashToken(token);

    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    // ✅ DB에 저장
    const rec = await prisma.payLinkToken.create({
        data: {
            tokenHash,
            amount,
            orderName,
            orderId,
            orderItems: Array.isArray(orderItems) ? orderItems.join(',') : String(orderItems ?? ''),
            expiresAt,
        },
        select: { id: true, expiresAt: true, amount: true, orderName: true, orderId: true, orderItems: true },
    });

    // Base URL 계산
    const base =
        process.env.NEXT_PUBLIC_BASE_URL ??
        (typeof window === 'undefined' ? '' : window.location.origin);

    // 클라이언트에 보낼 결제 URL
    const payUrl = `${base}/pay?token=${encodeURIComponent(token)}`;

    return Response.json({
        ok: true,
        token,            // 평문 토큰 (클라이언트에만 반환)
        payUrl,
        expiresAt: rec.expiresAt,
        amount: rec.amount,
        orderName: rec.orderName,
        orderId: rec.orderId,
        orderItems: rec.orderItems,
    });
}
