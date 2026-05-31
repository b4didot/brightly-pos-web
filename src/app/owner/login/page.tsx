"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type LoginResponse = {
  token?: string;
  error?: string;
  shop?: {
    id?: string;
    slug?: string;
  };
};

export default function OwnerLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = (await response.json()) as LoginResponse;

      if (!response.ok) {
        setError(data.error ?? "Login failed");
        return;
      }

      if (!data.token || !data.shop?.id || !data.shop.slug) {
        setError("Login response was incomplete");
        return;
      }

      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("shop_id", data.shop.id);
      router.push(`/owner/${data.shop.slug}`);
    } catch (loginError) {
      setError(
        loginError instanceof Error ? loginError.message : "Login failed",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-100 px-4 py-10 text-stone-950">
      <div className="w-full max-w-sm rounded-lg border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-200 px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
            Brightly POS
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-normal">
            Owner Dashboard
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-stone-700"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="mt-2 h-10 w-full rounded-md border border-stone-300 px-3 text-sm outline-none transition focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20"
              disabled={loading}
              autoComplete="username"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-stone-700"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 h-10 w-full rounded-md border border-stone-300 px-3 text-sm outline-none transition focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20"
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={!username || !password || loading}
            className="flex h-10 w-full items-center justify-center rounded-md bg-stone-950 px-4 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </main>
  );
}
