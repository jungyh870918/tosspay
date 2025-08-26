"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { loadTossPayments, ANONYMOUS } from "@tosspayments/tosspayments-sdk";

type OrderInfo = {
  tokenId: string; // 내부 토큰 ID (UUID)
  orderId: string; // 쇼핑몰 주문번호
  amount: number;
  orderName: string;
  orderItems: string;
};

export default function PayClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token"); // URL에 포함된 토큰

  const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null);
  const [widgets, setWidgets] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  const baseUrl = useMemo(() => {
    if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
    if (typeof window !== "undefined") return window.location.origin;
    return "";
  }, []);

  // ✅ 토큰 유효성 검사 API 호출
  useEffect(() => {
    if (!token) {
      setErr("잘못된 접근입니다. 토큰이 없습니다.");
      return;
    }

    (async () => {
      console.log("Validating token:", token);
      try {
        const res = await fetch(`/api/paytoken/validate?token=${encodeURIComponent(token)}`);
        const json = await res.json();
        if (!res.ok || !json.ok) {
          setErr(json.message || "유효하지 않은 결제 링크입니다.");
          return;
        }
        console.log("Validated token info:", json);
        setOrderInfo(json);
      } catch (e: any) {
        setErr(e?.message ?? "결제 정보를 불러오는 중 오류가 발생했습니다.");
      }
    })();
  }, [token]);

  // ✅ Toss 위젯 초기화
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

  // ✅ 결제 요청
  const onRequestPayment = async () => {
    if (!widgets || !orderInfo) return;
    try {
      await widgets.requestPayment({
        orderId: orderInfo.orderId, // ✅ 쇼핑몰 주문번호
        orderName: orderInfo.orderName,
        successUrl: `${baseUrl}/success`,
        failUrl: `${baseUrl}/fail`,
      });
    } catch (e) {
      console.error("requestPayment error", e);
    }
  };

  // ✅ 에러 화면
  if (err) {
    return <div className="max-w-md mx-auto mt-10 p-4 border rounded text-red-600">{err}</div>;
  }

  // ✅ 로딩 화면
  if (!orderInfo) {
    return <div className="max-w-md mx-auto mt-10 p-4 border rounded">결제 정보를 불러오는 중...</div>;
  }

  // ✅ 정상 화면
  return (
    <main className="max-w-md mx-auto p-4 mt-8 border rounded">
      <h1 className="text-xl font-semibold mb-2">결제</h1>
      <p className="text-sm mb-4">
        주문번호: <b>{orderInfo.orderId}</b> / 금액: <b>{orderInfo.amount.toLocaleString()}원</b>
        <br />
        품목: <b>{orderInfo.orderItems}</b>
      </p>

      <div id="payment-method" className="mb-4" />
      <div id="agreement" />

      <button onClick={onRequestPayment} className="mt-6 w-full rounded bg-black text-white py-3 text-sm">
        결제 진행하기
      </button>
    </main>
  );
}
