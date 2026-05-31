import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { hashActivationToken } from "@/lib/token";

type ActivateRequest = {
  activationToken?: unknown;
  deviceFingerprint?: unknown;
  platform?: unknown;
  appVersion?: unknown;
};

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

export async function POST(request: Request) {
  let body: ActivateRequest;

  try {
    body = (await request.json()) as ActivateRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (
    typeof body.activationToken !== "string" ||
    body.activationToken.trim().length === 0
  ) {
    return NextResponse.json(
      { error: "Missing activation token" },
      { status: 400 },
    );
  }

  const tokenHash = hashActivationToken(body.activationToken);
  const { data: activationToken, error: tokenError } = await supabaseAdmin
    .from("activation_tokens")
    .select("id, shop_id, status, expires_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (tokenError) {
    return NextResponse.json(
      { error: "Activation lookup failed" },
      { status: 500 },
    );
  }

  if (!activationToken) {
    return NextResponse.json(
      { error: "Invalid activation token" },
      { status: 401 },
    );
  }

  if (activationToken.status !== "unused") {
    return NextResponse.json(
      { error: "Activation token already used or unavailable" },
      { status: 400 },
    );
  }

  if (new Date(activationToken.expires_at).getTime() <= Date.now()) {
    return NextResponse.json(
      { error: "Activation token expired" },
      { status: 400 },
    );
  }

  const { data: shop, error: shopError } = await supabaseAdmin
    .from("shops")
    .select("id, name, slug, status")
    .eq("id", activationToken.shop_id)
    .single();

  if (shopError || !shop) {
    return NextResponse.json({ error: "Shop not found" }, { status: 404 });
  }

  if (shop.status !== "active") {
    return NextResponse.json(
      { error: "Shop is not active" },
      { status: 403 },
    );
  }

  const now = new Date().toISOString();
  const { data: device, error: deviceError } = await supabaseAdmin
    .from("devices")
    .insert({
      shop_id: shop.id,
      activation_token_id: activationToken.id,
      device_fingerprint: optionalString(body.deviceFingerprint),
      platform: optionalString(body.platform),
      app_version: optionalString(body.appVersion),
      status: "active",
      activated_at: now,
      last_seen_at: now,
    })
    .select("id")
    .single();

  if (deviceError || !device) {
    return NextResponse.json(
      { error: "Device activation failed" },
      { status: 500 },
    );
  }

  const { error: updateError } = await supabaseAdmin
    .from("activation_tokens")
    .update({ status: "used", used_at: now })
    .eq("id", activationToken.id);

  if (updateError) {
    return NextResponse.json(
      { error: "Activation token update failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    shopId: shop.id,
    shopName: shop.name,
    shopSlug: shop.slug,
    deviceId: device.id,
    status: "activated",
  });
}
