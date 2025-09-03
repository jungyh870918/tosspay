// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  console.log("Middleware applied to:", req.url);
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,DELETE,OPTIONS"
  );
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  // OPTIONS 요청 빠른 응답 (preflight)
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: res.headers });
  }

  return res;
}

// 모든 경로에 적용
export const config = {
  matcher: "/api/:path*",
};
