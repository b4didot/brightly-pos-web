"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Dashboard = {
  todaysSales: number;
  transactionCount: number;
  cashTotal: number;
  cardTotal: number;
  lastSyncTime: string | null;
};

type DashboardClientProps = {
  shopSlug: string;
};

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function lastSyncLabel(value: string | null) {
  return value ? new Date(value).toLocaleString() : "Never";
}

export default function DashboardClient({ shopSlug }: DashboardClientProps) {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("auth_token");

    if (!token) {
      router.push("/owner/login");
      return;
    }

    const fetchDashboard = async () => {
      try {
        const response = await fetch(
          `/api/dashboard?shopSlug=${encodeURIComponent(shopSlug)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("auth_token");
          router.push("/owner/login");
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "Failed to fetch dashboard");
        }

        setDashboard(data as Dashboard);
      } catch (dashboardError) {
        setError(
          dashboardError instanceof Error
            ? dashboardError.message
            : "Failed to fetch dashboard",
        );
      } finally {
        setLoading(false);
      }
    };

    void fetchDashboard();
  }, [router, shopSlug]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-100 text-stone-700">
        Loading...
      </main>
    );
  }

  if (error || !dashboard) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-100 px-4 text-stone-950">
        <div className="rounded-md border border-red-200 bg-white px-4 py-3 text-sm text-red-700 shadow-sm">
          {error || "Failed to load dashboard"}
        </div>
      </main>
    );
  }

  const metrics = [
    ["Total Sales", money(dashboard.todaysSales)],
    ["Transactions", dashboard.transactionCount.toString()],
    ["Cash", money(dashboard.cashTotal)],
    ["Card", money(dashboard.cardTotal)],
  ];

  return (
    <main className="min-h-screen bg-stone-100 text-stone-950">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6">
        <header className="border-b border-stone-200 pb-5">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-700">
            Brightly Owner Dashboard
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal">
            Today&apos;s Sales
          </h1>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map(([label, value]) => (
            <div
              key={label}
              className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm"
            >
              <p className="text-sm text-stone-600">{label}</p>
              <p className="mt-2 text-2xl font-semibold text-stone-950">
                {value}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-stone-600">Last Sync</p>
          <p className="mt-2 text-sm font-medium text-stone-950">
            {lastSyncLabel(dashboard.lastSyncTime)}
          </p>
        </div>
      </section>
    </main>
  );
}
