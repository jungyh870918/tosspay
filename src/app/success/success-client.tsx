// app/success/success-client.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type ConfirmOK = {
  orderId: string;
  approvedAt: string;
  totalAmount: number;
  orderName: string;
  orderItems: string; // DB에 문자열로 저장했으므로 string
};

type ConfirmErr = { message: string; code: string };

export default function SuccessClient() {
  const q = useSearchParams();
  const router = useRouter();

  const paymentKey = q.get("paymentKey");
  const orderId = q.get("orderId");
  const amount = Number(q.get("amount") ?? "0");

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
        console.log("/api/confirm response", json);
        if (!res.ok) {
          const e = json as ConfirmErr;
          router.replace(`/fail?code=${encodeURIComponent(e.code)}&message=${encodeURIComponent(e.message)}`);
          return;
        }
        setData(json as ConfirmOK);
      } catch (e: any) {
        setErr(e?.message ?? "승인 처리 중 오류가 발생했습니다.");
      }
    })();
  }, [paymentKey, orderId, amount, router]);

  if (err) return <div className="max-w-md mx-auto mt-10 p-4 border rounded text-red-600">{err}</div>;
  if (!data) return <div className="max-w-md mx-auto mt-10 p-4 border rounded">승인 처리 중...</div>;

  return (
    <div className="max-w-md mx-auto mt-10 p-4 border rounded space-y-3">
      <h2 className="text-xl font-bold text-green-700">✅ 결제가 완료되었습니다!</h2>

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
