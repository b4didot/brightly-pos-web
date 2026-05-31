import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

type Shop = {
  id: string;
  name: string;
  slug: string;
  status: string;
  plan: string;
  pilot_expires_at: string | null;
  created_at: string | null;
};

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString() : "None";
}

export default async function ShopsPage() {
  const { data: shops, error } = await supabaseAdmin
    .from("shops")
    .select("id, name, slug, status, plan, pilot_expires_at, created_at")
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-10">
        <header className="flex flex-col gap-4 border-b border-zinc-800 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-cyan-300">
              Brightly Command Center
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal">
              Shops
            </h1>
          </div>
          <Link
            href="/admin/shops/new"
            className="inline-flex h-10 items-center justify-center rounded-md bg-cyan-300 px-4 text-sm font-semibold text-zinc-950 transition hover:bg-cyan-200"
          >
            Create Shop
          </Link>
        </header>

        {error ? (
          <div className="rounded-md border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-100">
            {error.message}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-md border border-zinc-800 bg-zinc-900">
          <div className="grid grid-cols-[1.2fr_1fr_0.7fr_0.7fr_1fr_1fr_0.6fr] gap-4 border-b border-zinc-800 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400 max-lg:hidden">
            <span>Shop Name</span>
            <span>Slug</span>
            <span>Status</span>
            <span>Plan</span>
            <span>Pilot Expiry</span>
            <span>Created At</span>
            <span>Action</span>
          </div>
          {(shops as Shop[] | null)?.length ? (
            (shops as Shop[]).map((shop) => (
              <div
                key={shop.id}
                className="grid grid-cols-1 gap-3 border-b border-zinc-800 px-4 py-4 last:border-b-0 lg:grid-cols-[1.2fr_1fr_0.7fr_0.7fr_1fr_1fr_0.6fr] lg:gap-4"
              >
                <div>
                  <p className="font-medium text-white">{shop.name}</p>
                  <p className="mt-1 text-sm text-zinc-400 lg:hidden">
                    {shop.slug} · {shop.plan}
                  </p>
                </div>
                <p className="text-sm text-zinc-400 max-lg:hidden">
                  {shop.slug}
                </p>
                <span className="w-fit rounded-md border border-emerald-400/30 px-2 py-1 text-xs font-medium text-emerald-200">
                  {shop.status}
                </span>
                <p className="text-sm text-zinc-300 max-lg:hidden">
                  {shop.plan}
                </p>
                <p className="text-sm text-zinc-400 max-lg:hidden">
                  {formatDate(shop.pilot_expires_at)}
                </p>
                <p className="text-sm text-zinc-400 max-lg:hidden">
                  {formatDate(shop.created_at)}
                </p>
                <Link
                  href={`/admin/shops/${shop.id}`}
                  className="text-sm font-medium text-cyan-300 hover:text-cyan-200"
                >
                  View
                </Link>
              </div>
            ))
          ) : (
            <div className="px-4 py-12 text-center text-zinc-400">
              No shops yet.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
