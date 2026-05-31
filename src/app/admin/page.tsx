import Link from "next/link";

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <section className="mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center gap-6 px-6 py-10">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-cyan-300">
          Internal v0
        </p>
        <div>
          <h1 className="text-4xl font-semibold tracking-normal">
            Brightly Command Center
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-zinc-300">
            Manage POS shops, generate one-time activation tokens, and review
            activated devices.
          </p>
        </div>
        <Link
          href="/admin/shops"
          className="inline-flex h-11 w-fit items-center justify-center rounded-md bg-cyan-300 px-5 text-sm font-semibold text-zinc-950 transition hover:bg-cyan-200"
        >
          Manage shops
        </Link>
      </section>
    </main>
  );
}
