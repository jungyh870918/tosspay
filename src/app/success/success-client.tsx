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

  const from = useMemo(() => {
    const raw = q.get("from");
    if (!raw) return null;
    const safe = decodeURIComponent(raw.trim())
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "");
    return safe || null;
  }, [q]);

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

        if (mallBaseUrl) {
          try {
            await fetch(`${mallBaseUrl}/api/payments/save-finished`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId,
                paymentKey,
                amount,
                detail: json,
                from,
              }),
            });
          } catch (e) {
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

  const approvedDate = new Date(data.approvedAt).toISOString().split("T")[0];

  return (
    <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        {/* 상단 안내 배너 */}
        <div className="bg-green-50 text-green-700 text-center py-2 border-b border-gray-200">
          <h2 className="text-sm font-medium">결제가 완료되었습니다</h2>
        </div>

        {/* 본문 */}
        <div className="p-6 space-y-4 text-sm text-gray-700">
          <div className="flex justify-between">
            <span className="text-gray-500">주문명</span>
            <span className="font-medium">{data.orderName}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">주문항목</span>
            <span>{data.orderItems}</span>
          </div>

          <div className="flex justify-between border-t pt-4">
            <span className="text-gray-500">결제금액</span>
            <span className="font-semibold">
              {data.totalAmount.toLocaleString()}원
            </span>
          </div>

          <div className="flex justify-between border-t pt-3">
            <span className="text-gray-500">승인일자</span>
            <span>{approvedDate}</span>
          </div>
        </div>

        {/* 하단 안내 */}
        <div className="bg-gray-50 text-center text-xs text-gray-400 py-2 border-t">
          본 안내는 {approvedDate} 기준으로 발급되었습니다.
        </div>
      </div>
    </div>
  );
}
