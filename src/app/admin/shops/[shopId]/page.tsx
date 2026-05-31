import Link from "next/link";
import { notFound } from "next/navigation";
import { generateActivationKey } from "@/app/admin/actions";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

type ShopPageProps = {
  params: Promise<{ shopId: string }>;
  searchParams: Promise<{ error?: string; token?: string; preview?: string }>;
};

type ActivationToken = {
  id: string;
  token_preview: string;
  status: string;
  expires_at: string;
  used_at: string | null;
  created_at: string | null;
};

type Device = {
  id: string;
  platform: string | null;
  app_version: string | null;
  status: string;
  activated_at: string | null;
  last_seen_at: string | null;
  last_sync_at: string | null;
};

function formatDateTime(value: string | null) {
  return value ? new Date(value).toLocaleString() : "None";
}

export default async function ShopPage({
  params,
  searchParams,
}: ShopPageProps) {
  const { shopId } = await params;
  const { error, token, preview } = await searchParams;

  const [
    { data: shop, error: shopError },
    { data: activationTokens },
    { data: devices },
  ] = await Promise.all([
    supabaseAdmin
      .from("shops")
      .select("id, name, slug, status, plan, pilot_expires_at, created_at")
      .eq("id", shopId)
      .single(),
    supabaseAdmin
      .from("activation_tokens")
      .select("id, token_preview, status, expires_at, used_at, created_at")
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("devices")
      .select(
        "id, platform, app_version, status, activated_at, last_seen_at, last_sync_at",
      )
      .eq("shop_id", shopId)
      .order("activated_at", { ascending: false }),
  ]);

  if (shopError || !shop) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-10">
        <header className="flex flex-col gap-4 border-b border-zinc-800 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link href="/admin/shops" className="text-sm text-cyan-300">
              Back to shops
            </Link>
            <h1 className="mt-4 text-3xl font-semibold tracking-normal">
              {shop.name}
            </h1>
            <dl className="mt-4 grid gap-3 text-sm text-zinc-300 sm:grid-cols-2 lg:grid-cols-5">
              <div>
                <dt className="text-zinc-500">Slug</dt>
                <dd>{shop.slug}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Status</dt>
                <dd>{shop.status}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Plan</dt>
                <dd>{shop.plan}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Pilot expiry</dt>
                <dd>{formatDateTime(shop.pilot_expires_at)}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Created</dt>
                <dd>{formatDateTime(shop.created_at)}</dd>
              </div>
            </dl>
          </div>
          <form action={generateActivationKey}>
            <input type="hidden" name="shopId" value={shop.id} />
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-md bg-cyan-300 px-4 text-sm font-semibold text-zinc-950 transition hover:bg-cyan-200"
            >
              Generate Activation Token
            </button>
          </form>
        </header>

        {error ? (
          <div className="rounded-md border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        {token ? (
          <div className="rounded-md border border-cyan-300/40 bg-cyan-300/10 p-5">
            <p className="text-sm font-medium text-cyan-100">
              New activation token
            </p>
            <p className="mt-3 break-all font-mono text-2xl font-semibold text-white">
              {token}
            </p>
            <p className="mt-3 text-sm text-zinc-300">
              This token will only be shown once. Copy it now. After you leave
              this page, only {preview ?? "the preview"} will be shown.
            </p>
          </div>
        ) : null}

        <div className="rounded-md border border-zinc-800 bg-zinc-900">
          <div className="border-b border-zinc-800 px-4 py-3">
            <h2 className="font-semibold text-white">Activation Tokens</h2>
          </div>
          {(activationTokens as ActivationToken[] | null)?.length ? (
            <div className="divide-y divide-zinc-800">
              {(activationTokens as ActivationToken[]).map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-1 gap-3 px-4 py-4 lg:grid-cols-[1fr_0.6fr_1fr_1fr_1fr]"
                >
                  <p className="font-mono text-sm text-zinc-100">
                    {item.token_preview}
                  </p>
                  <span className="w-fit rounded-md border border-zinc-700 px-2 py-1 text-xs font-medium text-zinc-300">
                    {item.status}
                  </span>
                  <p className="text-sm text-zinc-400">
                    Expires {formatDateTime(item.expires_at)}
                  </p>
                  <p className="text-sm text-zinc-400">
                    Used {formatDateTime(item.used_at)}
                  </p>
                  <p className="text-sm text-zinc-400">
                    Created {formatDateTime(item.created_at)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-12 text-center text-zinc-400">
              No activation tokens yet.
            </div>
          )}
        </div>

        <div className="rounded-md border border-zinc-800 bg-zinc-900">
          <div className="border-b border-zinc-800 px-4 py-3">
            <h2 className="font-semibold text-white">Devices</h2>
          </div>
          {(devices as Device[] | null)?.length ? (
            <div className="divide-y divide-zinc-800">
              {(devices as Device[]).map((device) => (
                <div
                  key={device.id}
                  className="grid grid-cols-1 gap-3 px-4 py-4 lg:grid-cols-[1.2fr_0.7fr_0.7fr_0.7fr_1fr_1fr_1fr]"
                >
                  <p className="break-all font-mono text-sm text-zinc-100">
                    {device.id}
                  </p>
                  <p className="text-sm text-zinc-300">
                    {device.platform ?? "Unknown"}
                  </p>
                  <p className="text-sm text-zinc-300">
                    {device.app_version ?? "Unknown"}
                  </p>
                  <p className="text-sm text-zinc-300">{device.status}</p>
                  <p className="text-sm text-zinc-400">
                    {formatDateTime(device.activated_at)}
                  </p>
                  <p className="text-sm text-zinc-400">
                    {formatDateTime(device.last_seen_at)}
                  </p>
                  <p className="text-sm text-zinc-400">
                    {formatDateTime(device.last_sync_at)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-12 text-center text-zinc-400">
              No devices yet.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
