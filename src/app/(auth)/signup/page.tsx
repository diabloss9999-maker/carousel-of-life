/**
 * 회원가입 페이지 — 자체 가입 폼 제거 이후 로그인 페이지로 통합.
 *
 * OAuth(카카오·구글) 흐름에서는 첫 방문도 로그인 페이지 버튼 한 번으로 끝나므로
 * /signup 은 그대로 /login 으로 301 리다이렉트한다.
 * 외부 레거시 링크 호환을 위해 라우트는 유지.
 */
import { permanentRedirect } from "next/navigation";

import { ROUTES } from "@/lib/constants";

export default function SignupPage(): never {
  permanentRedirect(ROUTES.login);
}
