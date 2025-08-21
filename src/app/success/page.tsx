// app/success/page.tsx
"use client";

import { Suspense } from "react";
import SuccessClient from "./success-client";

export default function SuccessPage() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <SuccessClient />
    </Suspense>
  );
}
