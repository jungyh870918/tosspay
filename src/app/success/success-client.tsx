// app/success/success-client.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type ConfirmOK = {
  orderId: string;
  approvedAt: string;
  totalAmount: number;
  orderName: string;
  orderItems: string;
};

type ConfirmErr = { message: string; code: string };

export default function SuccessClient() {
  const q = useSearchParams();
  const router = useRouter();

  const paymentKey = q.get("paymentKey");
  const orderId = q.get("orderId");
  const amount = Number(q.get("amount") ?? "0");

  // ✅ from(subdomain) 파싱 + 정규화(보안)
  const from = useMemo(() => {
    const raw = q.get("from");
    if (!raw) return null;
    const trimmed = decodeURIComponent(raw.trim());
    // 소문자/숫자/하이픈만 허용 (서브도메인 안전화)
    const safe = trimmed.toLowerCase().replace(/[^a-z0-9-]/g, "");
    return safe || null;
  }, [q]);

  // ✅ 쇼핑몰 대상 베이스 URL
  const mallBaseUrl = useMemo(() => {
    if (!from) return null;
    return `https://${from}.medipaysolution.co.kr`;
  }, [from]);

  const [data, setData] = useState<ConfirmOK | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!paymentKey || !orderId || !amount) {
      setErr("결제 정보가 누락되었습니다.");
      return;
    }

    (async () => {
      try {
        // ✅ 1) 토스 결제 승인
        const res = await fetch("/api/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentKey, orderId, amount }),
        });

        const json = await res.json();
        if (!res.ok) {
          const e = json as ConfirmErr;
          router.replace(
            `/fail?code=${encodeURIComponent(
              e.code
            )}&message=${encodeURIComponent(e.message)}`
          );
          return;
        }

        // ✅ 2) 쇼핑몰 서버에 결제완료 알림 (서브도메인 기반)
        if (mallBaseUrl) {
          try {
            // await fetch(`http://localhost:3000/api/payments/save-finished`, {
            await fetch(`${mallBaseUrl}/api/payments/save-finished`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId, // 쇼핑몰 주문 ID
                paymentKey, // 토스 결제키
                amount, // 금액(옵션)
                detail: json, // 토스 confirm 응답 전문
                // 필요하면 from도 같이 넘겨둘 수 있음
                from,
              }),
            });
          } catch (e) {
            // 네트워크/CORS 이슈 등은 콘솔로만 기록 (UI는 성공 기준 유지)
            console.error("save-finished 호출 실패:", e);
          }
        }

        setData(json as ConfirmOK);
      } catch (e: any) {
        setErr(e?.message ?? "승인 처리 중 오류가 발생했습니다.");
      }
    })();
  }, [paymentKey, orderId, amount, mallBaseUrl, from, router]);

  if (err) {
    return (
      <div className="max-w-md mx-auto mt-10 p-4 border rounded text-red-600">
        {err}
      </div>
    );
  }
  if (!data) {
    return (
      <div className="max-w-md mx-auto mt-10 p-4 border rounded">
        승인 처리 중...
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-4 border rounded space-y-3">
      <h2 className="text-xl font-bold text-green-700">
        ✅ 결제가 완료되었습니다!
      </h2>

      <p>
        주문번호: <b>{data.orderId}</b>
      </p>
      <p>
        주문명: <b>{data.orderName}</b>
      </p>
      <p>
        주문항목: <b>{data.orderItems}</b>
      </p>
      <p>
        결제금액: <b>{data.totalAmount.toLocaleString()}원</b>
      </p>
      <p className="text-sm text-gray-500 mt-1">승인시각: {data.approvedAt}</p>
    </div>
  );
}
