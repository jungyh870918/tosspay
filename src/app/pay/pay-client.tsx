"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { loadTossPayments, ANONYMOUS } from "@tosspayments/tosspayments-sdk";

export default function PayClient() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") ?? "";
  const amount = Number(searchParams.get("amount") ?? "0");
  const orderName = searchParams.get("orderName") ?? "주문";

  const [widgets, setWidgets] = useState<any>(null);

  const baseUrl = useMemo(() => {
    if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
    if (typeof window !== "undefined") return window.location.origin;
    return "";
  }, []);

  useEffect(() => {
    if (!orderId || !amount || !baseUrl) return;

    (async () => {
      const tp = await loadTossPayments(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || "");
      const w = tp.widgets({ customerKey: ANONYMOUS });

      await w.setAmount({ currency: "KRW", value: amount });

      await Promise.all([w.renderPaymentMethods({ selector: "#payment-method", variantKey: "DEFAULT" }), w.renderAgreement({ selector: "#agreement", variantKey: "AGREEMENT" })]);

      setWidgets(w);
    })();
  }, [orderId, amount, baseUrl]);

  const onRequestPayment = async () => {
    if (!widgets) return;
    try {
      await widgets.requestPayment({
        orderId,
        orderName,
        successUrl: `${baseUrl}/success`,
        failUrl: `${baseUrl}/fail`,
      });
    } catch (e) {
      console.error("requestPayment error", e);
    }
  };

  if (!orderId || !amount) {
    return <div className="max-w-md mx-auto mt-10 p-4 border rounded">잘못된 요청입니다.</div>;
  }

  return (
    <main className="max-w-md mx-auto p-4 mt-8 border rounded">
      <h1 className="text-xl font-semibold mb-2">결제</h1>
      <p className="text-sm mb-4">
        주문번호: <b>{orderId}</b> / 금액: <b>{amount.toLocaleString()}원</b> / 품목: <b>{orderName}</b>
      </p>

      <div id="payment-method" className="mb-4" />
      <div id="agreement" />

      <button onClick={onRequestPayment} className="mt-6 w-full rounded bg-black text-white py-3 text-sm">
        결제 진행하기
      </button>
    </main>
  );
}
