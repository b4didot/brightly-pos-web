import { NextResponse } from "next/server";
import { verifyDeviceAuth } from "@/lib/apiAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type SyncTransactionItem = {
  id?: unknown;
  itemId?: unknown;
  itemName?: unknown;
  quantity?: unknown;
  unitPrice?: unknown;
  subtotal?: unknown;
};

type SyncTransaction = {
  id?: unknown;
  transactionNumber?: unknown;
  subtotal?: unknown;
  discountAmount?: unknown;
  vatAmount?: unknown;
  total?: unknown;
  status?: unknown;
  paymentMethod?: unknown;
  orderType?: unknown;
  createdByUserId?: unknown;
  createdByRole?: unknown;
  voidedByUserId?: unknown;
  isVoided?: unknown;
  voidedAt?: unknown;
  createdAt?: unknown;
  transactionItems?: unknown;
};

type SyncPayload = {
  shopId?: unknown;
  deviceId?: unknown;
  timestamp?: unknown;
  transactions?: unknown;
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

function numberValue(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function isoDate(value: unknown, fallback: string) {
  if (typeof value !== "string") {
    return fallback;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
}

async function writeSyncLog(values: {
  shopId: string;
  deviceId: string;
  status: "success" | "failed";
  recordsSynced?: number;
  bytesTransferred?: number;
  errorMessage?: string;
  durationMs: number;
}) {
  await supabaseAdmin.from("sync_logs").insert({
    shop_id: values.shopId,
    device_id: values.deviceId,
    sync_type: "transaction_sync",
    status: values.status,
    records_synced: values.recordsSynced ?? 0,
    bytes_transferred: values.bytesTransferred ?? 0,
    error_message: values.errorMessage,
    duration_ms: values.durationMs,
  });
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  let body: SyncPayload;

  try {
    body = (await request.json()) as SyncPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const shopId = requiredString(body.shopId);
  const deviceId = requiredString(body.deviceId);

  if (!shopId || !deviceId || !Array.isArray(body.transactions)) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  const auth = await verifyDeviceAuth(request, shopId, deviceId);

  if ("response" in auth) {
    return auth.response;
  }

  const transactions = body.transactions as SyncTransaction[];
  const now = new Date().toISOString();
  const payloadSize = JSON.stringify(body).length;
  const transactionsToUpsert = [];

  for (const transaction of transactions) {
    const transactionNumber = requiredString(transaction.transactionNumber);

    if (!transactionNumber) {
      return NextResponse.json(
        { error: "Transaction number is required" },
        { status: 400 },
      );
    }

    transactionsToUpsert.push({
      shop_id: shopId,
      transaction_id: transactionNumber,
      subtotal: numberValue(transaction.subtotal),
      discount_amount: numberValue(transaction.discountAmount),
      vat_amount: numberValue(transaction.vatAmount),
      total: numberValue(transaction.total),
      status: transaction.isVoided === true ? "voided" : "completed",
      payment_method: optionalString(transaction.paymentMethod) ?? "unknown",
      order_type: optionalString(transaction.orderType) ?? "unknown",
      created_by_user_id: optionalString(transaction.createdByUserId),
      created_by_role: optionalString(transaction.createdByRole) ?? "cashier",
      voided_by_user_id: optionalString(transaction.voidedByUserId),
      voided_at: optionalString(transaction.voidedAt),
      device_synced_at: isoDate(transaction.createdAt, now),
    });
  }

  const { data: insertedTransactions, error: transactionError } =
    await supabaseAdmin
      .from("transactions")
      .upsert(transactionsToUpsert, {
        onConflict: "shop_id,transaction_id",
      })
      .select("id, transaction_id");

  if (transactionError || !insertedTransactions) {
    await writeSyncLog({
      shopId,
      deviceId,
      status: "failed",
      recordsSynced: 0,
      bytesTransferred: payloadSize,
      errorMessage: transactionError?.message ?? "Failed to store transactions",
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json(
      { error: "Failed to store transactions" },
      { status: 500 },
    );
  }

  const cloudTransactionIdsByNumber = new Map<string, string>(
    insertedTransactions.map(
      (transaction: { id: string; transaction_id: string }) => [
        transaction.transaction_id,
        transaction.id,
      ],
    ),
  );

  const cloudTransactionIds = [...cloudTransactionIdsByNumber.values()];

  if (cloudTransactionIds.length > 0) {
    const { error: deleteItemsError } = await supabaseAdmin
      .from("transaction_items")
      .delete()
      .in("transaction_id", cloudTransactionIds);

    if (deleteItemsError) {
      await writeSyncLog({
        shopId,
        deviceId,
        status: "failed",
        recordsSynced: insertedTransactions.length,
        bytesTransferred: payloadSize,
        errorMessage: deleteItemsError.message,
        durationMs: Date.now() - startedAt,
      });

      return NextResponse.json(
        { error: "Failed to replace transaction items" },
        { status: 500 },
      );
    }
  }

  const itemsToInsert = transactions.flatMap((transaction) => {
    const transactionNumber = requiredString(transaction.transactionNumber);
    const cloudTransactionId = transactionNumber
      ? cloudTransactionIdsByNumber.get(transactionNumber)
      : null;
    const items = Array.isArray(transaction.transactionItems)
      ? (transaction.transactionItems as SyncTransactionItem[])
      : [];

    if (!cloudTransactionId) {
      return [];
    }

    return items.map((item) => ({
      transaction_id: cloudTransactionId,
      shop_id: shopId,
      item_name: requiredString(item.itemName) ?? "Unknown item",
      item_id: optionalString(item.itemId),
      quantity: Math.trunc(numberValue(item.quantity, 1)),
      unit_price: numberValue(item.unitPrice),
      subtotal: numberValue(item.subtotal),
    }));
  });

  if (itemsToInsert.length > 0) {
    const { error: itemsError } = await supabaseAdmin
      .from("transaction_items")
      .insert(itemsToInsert);

    if (itemsError) {
      await writeSyncLog({
        shopId,
        deviceId,
        status: "failed",
        recordsSynced: insertedTransactions.length,
        bytesTransferred: payloadSize,
        errorMessage: itemsError.message,
        durationMs: Date.now() - startedAt,
      });

      return NextResponse.json(
        { error: "Failed to store transaction items" },
        { status: 500 },
      );
    }
  }

  await supabaseAdmin
    .from("devices")
    .update({
      last_seen_at: now,
      last_sync_at: now,
      last_transaction_sync_at: now,
    })
    .eq("id", deviceId);

  await writeSyncLog({
    shopId,
    deviceId,
    status: "success",
    recordsSynced: insertedTransactions.length,
    bytesTransferred: payloadSize,
    durationMs: Date.now() - startedAt,
  });

  return NextResponse.json({
    status: "success",
    transactionsSynced: insertedTransactions.length,
    itemsSynced: itemsToInsert.length,
  });
}
