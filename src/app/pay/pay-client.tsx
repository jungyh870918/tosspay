"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { loadTossPayments, ANONYMOUS } from "@tosspayments/tosspayments-sdk";

type OrderInfo = {
  tokenId: string;
  orderId: string; // ← 내부적으로만 사용 (표시 X)
  amount: number;
  orderName: string;
  orderItems: string;
};

function formatKRW(n: number) {
  return n.toLocaleString("ko-KR");
}

export default function PayClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const from = searchParams.get("from");

  const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null);
  const [widgets, setWidgets] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  const baseUrl = useMemo(() => {
    if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
    if (typeof window !== "undefined") return window.location.origin;
    return "";
  }, []);

  // 토큰 유효성 검사
  useEffect(() => {
    if (!token) {
      setErr("잘못된 접근입니다. 토큰이 없습니다.");
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/api/paytoken/validate?token=${encodeURIComponent(token)}`);
        const json = await res.json();
        if (!res.ok || !json.ok) {
          setErr(json.message || "유효하지 않은 결제 링크입니다.");
          return;
        }
        setOrderInfo(json);
      } catch (e: any) {
        setErr(e?.message ?? "결제 정보를 불러오는 중 오류가 발생했습니다.");
      }
    })();
  }, [token]);

  // Toss 위젯 초기화
  useEffect(() => {
    if (!orderInfo || !baseUrl) return;
    (async () => {
      const tp = await loadTossPayments(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || "");
      const w = tp.widgets({ customerKey: ANONYMOUS });
      await w.setAmount({ currency: "KRW", value: orderInfo.amount });
      await Promise.all([w.renderPaymentMethods({ selector: "#payment-method", variantKey: "DEFAULT" }), w.renderAgreement({ selector: "#agreement", variantKey: "AGREEMENT" })]);
      setWidgets(w);
    })();
  }, [orderInfo, baseUrl]);

  // 결제 요청
  const onRequestPayment = async () => {
    if (!widgets || !orderInfo) return;

    const successUrl = new URL("/success", baseUrl);
    const failUrl = new URL("/fail", baseUrl);
    if (from) {
      successUrl.searchParams.set("from", from);
      failUrl.searchParams.set("from", from);
    }

    try {
      await widgets.requestPayment({
        orderId: orderInfo.orderId, // 서버 검증용으로만 사용
        orderName: orderInfo.orderName,
        successUrl: successUrl.toString(),
        failUrl: failUrl.toString(),
      });
    } catch (e) {
      console.error("requestPayment error", e);
    }
  };

  if (err) return <div className="max-w-md mx-auto mt-10 p-4 border rounded text-red-600">{err}</div>;

  if (!orderInfo) return <div className="max-w-md mx-auto mt-10 p-4 border rounded">결제 정보를 불러오는 중...</div>;

  return (
    <main className="max-w-md mx-auto p-4 mt-8">
      {/* 상단 결제 요약 카드 */}
      {/* 상단 결제 요약 카드 */}
      {/* 상단 결제 요약 카드 */}
      <section className="mb-5 rounded-2xl border border-gray-200 shadow-soft bg-white overflow-hidden">
        <div className="px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            {/* 품목 */}
            <div className="flex flex-col justify-center">
              <p className="text-xs text-gray-500 mb-1">품목</p>
              <p className="text-base font-medium text-gray-900">{orderInfo.orderItems}</p>
            </div>

            {/* 결제 금액 */}
            <div className="flex flex-col justify-center text-right">
              <p className="text-xs text-gray-500 mb-1">결제 금액</p>
              <p className="text-base font-semibold text-gray-900">₩ {formatKRW(orderInfo.amount)}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 결제 수단 위젯 */}
      <div id="payment-method" className="mb-4" />
      <div id="agreement" />

      <button onClick={onRequestPayment} className="mt-6 w-full rounded-xl bg-black text-white py-3 text-sm font-medium hover:bg-gray-900 active:scale-[0.99] transition">
        결제 진행하기
      </button>
    </main>
  );
}
