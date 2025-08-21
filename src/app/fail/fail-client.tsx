"use client";

import { useSearchParams, useRouter } from "next/navigation";

export default function FailClient() {
  const q = useSearchParams();
  const router = useRouter();
  const code = q.get("code") ?? "알 수 없음";
  const message = q.get("message") ?? "결제가 정상적으로 완료되지 않았습니다.";

  return (
    <div className="max-w-md mx-auto mt-10 p-4 border rounded">
      <h2 className="text-xl font-bold text-red-600">❌ 결제에 실패했습니다.</h2>
      <p className="mt-2 text-sm">
        <b>오류 코드:</b> {code}
      </p>
      <p className="text-sm">
        <b>사유:</b> {message}
      </p>
      <button onClick={() => router.push("/")} className="mt-6 w-full rounded bg-red-600 text-white py-3 text-sm">
        홈으로
      </button>
    </div>
  );
}
