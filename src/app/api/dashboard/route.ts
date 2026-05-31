import { NextResponse } from "next/server";
import { verifyOwnerRequest } from "@/lib/apiAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type TransactionRow = {
  total: number | string | null;
  status: string | null;
  payment_method: string | null;
};

function numeric(value: number | string | null) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const shopSlug = url.searchParams.get("shopSlug");

    if (!shopSlug) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = await verifyOwnerRequest(request);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: shop, error: shopError } = await supabaseAdmin
      .from("shops")
      .select("id, slug")
      .eq("id", session.shopId)
      .eq("slug", shopSlug)
      .maybeSingle();

    if (shopError) {
      return NextResponse.json(
        { error: "Failed to verify shop" },
        { status: 500 },
      );
    }

    if (!shop) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data: transactions, error: transactionsError } =
      await supabaseAdmin
        .from("transactions")
        .select("total, status, payment_method")
        .eq("shop_id", session.shopId)
        .gte("device_synced_at", today.toISOString())
        .lt("device_synced_at", tomorrow.toISOString());

    if (transactionsError) {
      return NextResponse.json(
        { error: "Failed to fetch transactions" },
        { status: 500 },
      );
    }

    const completedTransactions = ((transactions ?? []) as TransactionRow[])
      .filter((transaction) => transaction.status !== "voided");

    const todaysSales = completedTransactions.reduce(
      (sum, transaction) => sum + numeric(transaction.total),
      0,
    );
    const cashTotal = completedTransactions
      .filter((transaction) => transaction.payment_method === "cash")
      .reduce((sum, transaction) => sum + numeric(transaction.total), 0);
    const cardTotal = completedTransactions
      .filter((transaction) => transaction.payment_method === "card")
      .reduce((sum, transaction) => sum + numeric(transaction.total), 0);

    const { data: device, error: deviceError } = await supabaseAdmin
      .from("devices")
      .select("last_sync_at, last_transaction_sync_at")
      .eq("shop_id", session.shopId)
      .order("last_transaction_sync_at", {
        ascending: false,
        nullsFirst: false,
      })
      .limit(1)
      .maybeSingle();

    if (deviceError) {
      return NextResponse.json(
        { error: "Failed to fetch sync status" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      todaysSales,
      transactionCount: completedTransactions.length,
      cashTotal,
      cardTotal,
      lastSyncTime: device?.last_transaction_sync_at ?? device?.last_sync_at,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard" },
      { status: 500 },
    );
  }
}
