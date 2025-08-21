// app/api/confirm/route.ts
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { paymentKey, orderId, amount } = await req.json();

        if (!paymentKey || !orderId || !amount) {
            return Response.json({ message: 'invalid params' }, { status: 400 });
        }

        // Toss Payments 결제 승인
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

        if (!tossRes.ok) {
            // { code, message } 형태로 반환됨
            return Response.json(json, { status: 400 });
        }

        // 필요한 최소 응답만 반환
        return Response.json({
            orderId: json.orderId,
            approvedAt: json.approvedAt,
            totalAmount: json.totalAmount,
        });
    } catch (e: any) {
        return Response.json({ message: e?.message ?? 'server error' }, { status: 500 });
    }
}
