"use client";

import { Suspense } from "react";
import FailClient from "./fail-client";

export default function FailPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto mt-10 p-4 border rounded">실패 페이지 로딩 중...</div>}>
      <FailClient />
    </Suspense>
  );
}
