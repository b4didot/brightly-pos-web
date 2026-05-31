import { NextResponse } from "next/server";
import { verifyDeviceAuth } from "@/lib/apiAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function requiredString(value: string | null) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const shopId = requiredString(url.searchParams.get("shopId"));
  const deviceId = requiredString(url.searchParams.get("deviceId"));

  if (!shopId || !deviceId) {
    return NextResponse.json(
      { error: "Missing parameters" },
      { status: 400 },
    );
  }

  const auth = await verifyDeviceAuth(request, shopId, deviceId);

  if ("response" in auth) {
    return auth.response;
  }

  const { data: backup, error } = await supabaseAdmin
    .from("config_backups")
    .select("backup_data, config_version, created_at")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch config" },
      { status: 500 },
    );
  }

  if (!backup) {
    return NextResponse.json({ error: "No backup found" }, { status: 404 });
  }

  await supabaseAdmin
    .from("devices")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", deviceId);

  return NextResponse.json({
    backup: backup.backup_data,
    version: backup.config_version,
    createdAt: backup.created_at,
  });
}
