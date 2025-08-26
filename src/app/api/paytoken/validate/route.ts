import { NextRequest } from 'next/server';
import { prisma } from '@/db/prisma';
import crypto from 'crypto';

function hashToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
        return Response.json({ ok: false, code: 'BAD_REQUEST' }, { status: 400 });
    }

    // DB 조회
    const rec = await prisma.payLinkToken.findFirst({
        where: { tokenHash: hashToken(token) },
        select: {
            id: true,
            amount: true,
            orderName: true,
            orderId: true,     // ✅ 새로 추가된 필드
            orderItems: true,  // ✅ 새로 추가된 필드
            used: true,
            expiresAt: true,
        },
    });

    // 존재하지 않음
    if (!rec) {
        return Response.json({ ok: false, code: 'NOT_FOUND' }, { status: 404 });
    }

    // 이미 사용됨
    if (rec.used) {
        return Response.json(
            { ok: false, code: 'ALREADY_USED', message: '이미 사용된 링크입니다.' },
            { status: 409 }
        );
    }

    // 만료됨
    if (rec.expiresAt < new Date()) {
        return Response.json(
            { ok: false, code: 'EXPIRED', message: '만료된 링크입니다.' },
            { status: 410 }
        );
    }

    // ✅ 정상 응답
    return Response.json({
        ok: true,
        tokenId: rec.id,         // 내부 참조용 ID
        orderId: rec.orderId,    // 쇼핑몰 주문번호
        amount: rec.amount,
        orderName: rec.orderName,
        orderItems: rec.orderItems, // 문자열 그대로 반환
    });
}
