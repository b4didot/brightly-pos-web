import Link from "next/link";
import { createShop } from "@/app/admin/actions";

type NewShopPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function NewShopPage({ searchParams }: NewShopPageProps) {
  const { error } = await searchParams;

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-10">
        <header className="border-b border-zinc-800 pb-6">
          <Link href="/admin/shops" className="text-sm text-cyan-300">
            Back to shops
          </Link>
          <h1 className="mt-4 text-3xl font-semibold tracking-normal">
            Create shop
          </h1>
        </header>

        {error ? (
          <div className="rounded-md border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <form
          action={createShop}
          className="flex flex-col gap-5 rounded-md border border-zinc-800 bg-zinc-900 p-5"
        >
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-zinc-300">Shop Name</span>
            <input
              name="name"
              required
              autoFocus
              className="h-11 rounded-md border border-zinc-700 bg-zinc-950 px-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-cyan-300"
              placeholder="Coffee Bar"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-zinc-300">Slug</span>
            <input
              name="slug"
              required
              className="h-11 rounded-md border border-zinc-700 bg-zinc-950 px-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-cyan-300"
              placeholder="coffee-bar"
            />
          </label>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-zinc-300">Plan</span>
              <select
                name="plan"
                defaultValue="pilot"
                className="h-11 rounded-md border border-zinc-700 bg-zinc-950 px-3 text-white outline-none transition focus:border-cyan-300"
              >
                <option value="pilot">pilot</option>
                <option value="standard">standard</option>
                <option value="pro">pro</option>
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-zinc-300">
                Pilot Expiry
              </span>
              <input
                name="pilot_expires_at"
                type="datetime-local"
                className="h-11 rounded-md border border-zinc-700 bg-zinc-950 px-3 text-white outline-none transition focus:border-cyan-300"
              />
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              href="/admin/shops"
              className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-700 px-4 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-md bg-cyan-300 px-4 text-sm font-semibold text-zinc-950 transition hover:bg-cyan-200"
            >
              Create shop
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
