// app/api/paytoken/qr/route.ts
import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { createPlainToken, hashToken } from "@/lib/paylink";
import { prisma } from "@/db/prisma";

// ✅ 배포/프록시 환경에서도 안전하게 base URL 만들기
function getBaseUrl(req: NextRequest) {
  const env = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  if (env) return env.replace(/\/$/, "");
  const proto =
    req.headers.get("x-forwarded-proto") ||
    req.headers.get("x-forwarded-protocol") ||
    "https";
  const host =
    req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  return `${proto}://${host}`.replace(/\/$/, "");
}

/* ------------------------------- GET: 이미지 ------------------------------- */
/**
 * 이미 발급된 토큰으로 QR 이미지를 반환합니다.
 * <img src="/api/paytoken/qr?token=...&size=360&format=png&download=1">
 * query:
 *   - token (required)
 *   - size=320 (max 1024)
 *   - margin=2
 *   - format=png|svg (default png)
 *   - download=1 (옵션: 파일로 다운로드)
 */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const token = sp.get("token");
    const format = (sp.get("format") || "png").toLowerCase();
    const size = Math.min(Number(sp.get("size") || 320), 1024);
    const margin = Number(sp.get("margin") || 2);
    const download = sp.get("download") === "1";

    if (!token) {
      return NextResponse.json(
        { ok: false, message: "token required" },
        { status: 400 }
      );
    }

    const base = getBaseUrl(req);
    const payUrl = `${base}/pay?token=${encodeURIComponent(token)}`;

    if (format === "svg") {
      const svg = await QRCode.toString(payUrl, {
        type: "svg",
        margin,
        width: size,
      });
      const res = new NextResponse(svg, {
        status: 200,
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "public, max-age=86400",
        },
      });
      if (download)
        res.headers.set(
          "Content-Disposition",
          'attachment; filename="pay-qr.svg"'
        );
      return res;
    }

    const png = await QRCode.toBuffer(payUrl, {
      type: "png",
      margin,
      width: size,
      errorCorrectionLevel: "M",
    });
    const res = new NextResponse(new Uint8Array(png), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400",
      },
    });
    if (download)
      res.headers.set(
        "Content-Disposition",
        'attachment; filename="pay-qr.png"'
      );
    return res;
  } catch (e) {
    console.error("GET /api/paytoken/qr error", e);
    return NextResponse.json(
      { ok: false, message: "QR generation failed" },
      { status: 500 }
    );
  }
}

/* ------------------------------- POST: JSON ------------------------------- */
/**
 * 새 결제 토큰을 발급하고 DB에 저장한 뒤, JSON으로만 응답합니다.
 * body: { amount, orderName, orderId, orderItems?, ttlMinutes? }
 * res:  { ok, token, payUrl, qrUrl, expiresAt }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      amount,
      orderName,
      orderId,
      orderItems,
      ttlMinutes = 30,
    }: {
      amount: number;
      orderName: string;
      orderId: string;
      orderItems?: string[] | string;
      ttlMinutes?: number;
    } = body;

    if (!Number.isFinite(amount) || amount <= 0 || !orderName || !orderId) {
      return NextResponse.json(
        { ok: false, message: "invalid params" },
        { status: 400 }
      );
    }

    // 토큰 생성 & 해시 저장
    const token = createPlainToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    await prisma.payLinkToken.create({
      data: {
        tokenHash,
        amount,
        orderName,
        orderId,
        orderItems: Array.isArray(orderItems)
          ? orderItems.join(",")
          : String(orderItems ?? ""),
        expiresAt,
      },
      select: { id: true },
    });

    const base = getBaseUrl(req);
    const payUrl = `${base}/pay?token=${encodeURIComponent(token)}`;
    const qrUrl = `${base}/api/paytoken/qr?token=${encodeURIComponent(
      token
    )}&size=360&format=png`;

    return NextResponse.json({
      ok: true,
      token,
      payUrl,
      qrUrl,
      expiresAt,
    });
  } catch (e) {
    console.error("POST /api/paytoken/qr error", e);
    return NextResponse.json(
      { ok: false, message: "QR issue failed" },
      { status: 500 }
    );
  }
}
