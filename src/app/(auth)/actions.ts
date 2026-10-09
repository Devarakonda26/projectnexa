"use server";

import { redirect } from "next/navigation";
import { safeNextPath } from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/server";
import { publicEnv } from "@/lib/env.public";
import { forgotPasswordSchema, newPasswordSchema, signInSchema, signUpSchema } from "@/lib/validation/schemas";
import { parseForm, type FormState } from "@/lib/validation/form";

const GENERIC_SIGN_IN_ERROR = "Incorrect email or password.";

function siteUrl() {
  return publicEnv().NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
}

export async function signInAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(signInSchema, formData);
  if (!parsed.success) return parsed.state;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  // One message for every failure: never reveal whether an email is registered.
  if (error) return { error: GENERIC_SIGN_IN_ERROR };

  redirect(safeNextPath(formData.get("next")));
}

export async function signUpAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(signUpSchema, formData);
  if (!parsed.success) return parsed.state;
  const { fullName, email, password, phone } = parsed.data;

  const next = safeNextPath(formData.get("next"));
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, ...(phone ? { phone } : {}) },
      emailRedirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) return { error: "We could not create the account. Please check your details and try again." };
  if (data.session) redirect(next); // email confirmation disabled in this project
  // Same message whether or not the address already existed.
  return { ok: true, message: "Check your email for a confirmation link to finish creating your account." };
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function forgotPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(forgotPasswordSchema, formData);
  if (!parsed.success) return parsed.state;

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent("/update-password")}`,
  });
  // Always the same answer, so the form cannot be used to discover registered emails.
  return { ok: true, message: "If that email is registered, a reset link is on its way." };
}

export async function updatePasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(newPasswordSchema, formData);
  if (!parsed.success) return parsed.state;

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: "Your reset link has expired. Request a new one." };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: "Could not update the password. Try a different one." };
  redirect("/account");
}

