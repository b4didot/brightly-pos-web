"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  generateActivationToken,
  hashActivationToken,
  previewActivationToken,
} from "@/lib/token";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function readRequiredText(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Missing ${key}`);
  }

  return value.trim();
}

export async function createShop(formData: FormData) {
  const name = readRequiredText(formData, "name");
  const slug = readRequiredText(formData, "slug");
  const planValue = formData.get("plan");
  const pilotExpiryValue = formData.get("pilot_expires_at");
  const plan =
    typeof planValue === "string" && planValue.trim().length > 0
      ? planValue.trim()
      : "pilot";
  const pilot_expires_at =
    typeof pilotExpiryValue === "string" && pilotExpiryValue.length > 0
      ? pilotExpiryValue
      : null;

  const { error } = await supabaseAdmin.from("shops").insert({
    name,
    slug,
    status: "active",
    plan,
    pilot_expires_at,
  });

  if (error) {
    redirect(`/admin/shops/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/shops");
  redirect("/admin/shops");
}

export async function generateActivationKey(formData: FormData) {
  const shopId = readRequiredText(formData, "shopId");
  const token = generateActivationToken();
  const tokenPreview = previewActivationToken(token);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const { error } = await supabaseAdmin.from("activation_tokens").insert({
    shop_id: shopId,
    token_hash: hashActivationToken(token),
    token_preview: tokenPreview,
    status: "unused",
    expires_at: expiresAt.toISOString(),
  });

  if (error) {
    redirect(
      `/admin/shops/${shopId}?error=${encodeURIComponent(error.message)}`,
    );
  }

  revalidatePath(`/admin/shops/${shopId}`);
  redirect(
    `/admin/shops/${shopId}?token=${encodeURIComponent(token)}&preview=${encodeURIComponent(tokenPreview)}`,
  );
}
