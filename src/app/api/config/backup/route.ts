import { NextResponse } from "next/server";
import { verifyDeviceAuth } from "@/lib/apiAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type ConfigBackupPayload = {
  shopId?: unknown;
  deviceId?: unknown;
  backup?: unknown;
};

type ConfigBackup = {
  configVersion?: unknown;
  createdByRole?: unknown;
};

function requiredString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  let body: ConfigBackupPayload;

  try {
    body = (await request.json()) as ConfigBackupPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const shopId = requiredString(body.shopId);
  const deviceId = requiredString(body.deviceId);

  if (!shopId || !deviceId || !body.backup || typeof body.backup !== "object") {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  const auth = await verifyDeviceAuth(request, shopId, deviceId);

  if ("response" in auth) {
    return auth.response;
  }

  const backup = body.backup as ConfigBackup;
  const configVersion =
    typeof backup.configVersion === "number" &&
    Number.isInteger(backup.configVersion)
      ? backup.configVersion
      : null;

  if (!configVersion) {
    return NextResponse.json(
      { error: "Missing config version" },
      { status: 400 },
    );
  }

  const backupSizeBytes = JSON.stringify(body.backup).length;
  const { data, error } = await supabaseAdmin
    .from("config_backups")
    .insert({
      shop_id: shopId,
      backup_type: "manual",
      config_version: configVersion,
      backup_data: body.backup,
      device_id: deviceId,
      created_by_role: optionalString(backup.createdByRole),
      backup_size_bytes: backupSizeBytes,
    })
    .select("id")
    .single();

  if (error || !data) {
    await supabaseAdmin.from("sync_logs").insert({
      shop_id: shopId,
      device_id: deviceId,
      sync_type: "config_backup",
      status: "failed",
      bytes_transferred: backupSizeBytes,
      error_message: error?.message ?? "Failed to store backup",
      duration_ms: Date.now() - startedAt,
    });

    return NextResponse.json(
      { error: "Failed to store backup" },
      { status: 500 },
    );
  }

  await supabaseAdmin
    .from("devices")
    .update({
      last_seen_at: new Date().toISOString(),
      last_sync_at: new Date().toISOString(),
    })
    .eq("id", deviceId);

  await supabaseAdmin.from("sync_logs").insert({
    shop_id: shopId,
    device_id: deviceId,
    sync_type: "config_backup",
    status: "success",
    bytes_transferred: backupSizeBytes,
    duration_ms: Date.now() - startedAt,
  });

  return NextResponse.json({
    status: "success",
    backupId: data.id,
  });
}
