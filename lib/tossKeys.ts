// /lib/tossKeys.ts

type PublicKeyMap = Record<string, { NEXT_PUBLIC_TOSS_CLIENT_KEY: string }>;
type SecretKeyMap = Record<string, { TOSS_SECRET_KEY: string }>;

const publicKeyMap: PublicKeyMap = JSON.parse(process.env.NEXT_PUBLIC_TOSS_PUBLIC_KEY_MAP || "{}");
const secretKeyMap: SecretKeyMap = JSON.parse(process.env.TOSS_SECRET_KEY_MAP || "{}");

/**
 * 서브도메인 → 공개키
 * @param sub 서브도메인 (예: "healingeye")
 */
export function getTossPublicKey(sub: string) {


    return publicKeyMap[sub]?.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? null;
}

/**
 * 서브도메인 → 시크릿키 (서버 전용)
 * @param sub 서브도메인 (예: "healingeye")
 */
export function getTossSecretKey(sub: string): string | null {
    return secretKeyMap[sub]?.TOSS_SECRET_KEY ?? null;
}
