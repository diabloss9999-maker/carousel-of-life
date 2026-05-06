"use server";

/**
 * 인증 관련 Server Action.
 */
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { ROUTES } from "@/lib/constants";
import { clientEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export interface AuthFormState {
  kind: "idle" | "error" | "success";
  message?: string;
}

const credentialsSchema = z.object({
  email: z.string().email("이메일 형식이 올바르지 않아요."),
  password: z
    .string()
    .min(8, "비밀번호는 여덟 자 이상이어야 해요.")
    .max(72, "비밀번호가 너무 길어요."),
});

const signupSchema = credentialsSchema.extend({
  displayName: z
    .string()
    .min(1, "이름을 입력해주세요.")
    .max(40, "이름이 너무 길어요.")
    .optional(),
});

/**
 * 이메일 + 비밀번호 로그인.
 */
export async function loginAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return {
      kind: "error",
      message: parsed.error.issues[0]?.message ?? "입력값이 올바르지 않아요.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return {
      kind: "error",
      message:
        error.message === "Invalid login credentials"
          ? "이메일 또는 비밀번호가 일치하지 않아요."
          : `로그인에 실패했어요: ${error.message}`,
    };
  }

  revalidatePath("/", "layout");
  redirect(ROUTES.today);
}

/**
 * 이메일 + 비밀번호 회원가입.
 */
export async function signupAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    displayName: formData.get("displayName") || undefined,
  });
  if (!parsed.success) {
    return {
      kind: "error",
      message: parsed.error.issues[0]?.message ?? "입력값이 올바르지 않아요.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${clientEnv.NEXT_PUBLIC_APP_URL}${ROUTES.authCallback}`,
      data: parsed.data.displayName
        ? { display_name: parsed.data.displayName }
        : undefined,
    },
  });

  if (error) {
    return {
      kind: "error",
      message: `가입에 실패했어요: ${error.message}`,
    };
  }

  // 이메일 인증이 켜진 경우 session 이 비어있다.
  if (!data.session) {
    return {
      kind: "success",
      message:
        "이메일로 인증 링크가 보내졌어요. 메일함을 확인해주세요.",
    };
  }

  revalidatePath("/", "layout");
  redirect(ROUTES.onboarding);
}

/**
 * 로그아웃.
 */
export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect(ROUTES.home);
}
