import type { Metadata } from "next";
import { DiscoveryForm } from "./DiscoveryForm";

export const metadata: Metadata = {
  title: "Brightly POS - Pilot Feedback",
  description: "Brightly POS pilot discovery form",
};

export default function DiscoveryPage() {
  return (
    <main className="min-h-screen bg-[#f7f4ef] text-stone-950">
      <section className="mx-auto w-full max-w-[600px] px-5 py-10 sm:px-6 sm:py-14">
        <header className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-800">
            Brightly POS
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-stone-950 sm:text-4xl">
            Pilot Feedback
          </h1>
          <p className="mt-3 text-base leading-7 text-stone-600">
            Tell us how your shop runs today so we can shape the pilot around
            real checkout, staff, reporting, and offline needs.
          </p>
        </header>

        <div className="rounded-lg border border-stone-200 bg-white/82 p-5 shadow-sm sm:p-7">
          <DiscoveryForm />
        </div>
      </section>
    </main>
  );
}
