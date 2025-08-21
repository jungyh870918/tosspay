"use client";

import { Suspense } from "react";
import PayClient from "./pay-client";

export default function PayPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto mt-10 p-4 border rounded">결제 페이지 로딩 중...</div>}>
      <PayClient />
    </Suspense>
  );
}
