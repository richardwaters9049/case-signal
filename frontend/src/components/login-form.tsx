"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { apiFetch, responseMessage } from "@/lib/api";

export function LoginForm() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [email, setEmail] = useState("richard@casesignal.local");
  const [password, setPassword] = useState("CaseSignal2026!");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await apiFetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error(await responseMessage(response));
      }

      router.replace("/dashboard");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "CaseSignal could not sign you in.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-dim-grey-950 px-6 py-10 text-dim-grey-900">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl overflow-hidden rounded-3xl bg-ghost-white-50 shadow-2xl shadow-dim-grey-950/40 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="relative overflow-hidden bg-dim-grey-900 p-8 text-dim-grey-50 sm:p-12">
          <div className="absolute -top-24 -right-12 h-72 w-72 rounded-full bg-ash-grey-500/30 blur-3xl" />
          <div className="absolute -bottom-28 -left-16 h-72 w-72 rounded-full bg-ash-grey-400/20 blur-3xl" />
          <div className="relative flex h-full flex-col justify-between">
            <div>
              <p className="text-sm font-semibold tracking-[0.2em] text-ash-grey-200 uppercase">
                CaseSignal
              </p>
              <h1 className="mt-8 max-w-md text-4xl font-semibold tracking-tight sm:text-5xl">
                When automation pauses, your team stays in control.
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-8 text-dim-grey-100">
                Review signals, resolve exceptions and keep operational
                workflows moving with a complete audit trail.
              </p>
            </div>
            <div className="mt-16 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              <Value label="Human review" value="Always clear" />
              <Value label="Audit history" value="Built in" />
              <Value label="Workflow state" value="Protected" />
            </div>
          </div>
        </section>
        <section className="flex items-center p-8 sm:p-12">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28 }}
            className="mx-auto w-full max-w-sm"
          >
            <p className="text-sm font-semibold tracking-[0.16em] text-ash-grey-700 uppercase">
              Operator sign in
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              Welcome back
            </h2>
            <p className="mt-3 leading-7 text-dim-grey-600">
              Use the demonstration account to explore the authenticated
              workflow dashboard.
            </p>
            <form className="mt-8 space-y-5" onSubmit={submit}>
              <label className="block text-sm font-medium">
                Email address
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  type="email"
                  required
                  className="mt-2 w-full rounded-xl border border-ash-grey-300 bg-ghost-white-50 px-3 py-3 outline-none transition focus:border-ash-grey-600 focus:ring-4 focus:ring-ash-grey-100"
                />
              </label>
              <label className="block text-sm font-medium">
                Password
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  type="password"
                  required
                  className="mt-2 w-full rounded-xl border border-ash-grey-300 bg-ghost-white-50 px-3 py-3 outline-none transition focus:border-ash-grey-600 focus:ring-4 focus:ring-ash-grey-100"
                />
              </label>
              {error ? (
                <p
                  role="alert"
                  className="rounded-xl border border-brick-ember-200 bg-brick-ember-50 px-3 py-3 text-sm text-brick-ember-800"
                >
                  {error}
                </p>
              ) : null}
              <button
                disabled={isSubmitting}
                type="submit"
                className="w-full rounded-xl bg-dim-grey-900 px-4 py-3 font-semibold text-dim-grey-50 transition hover:bg-dim-grey-800 focus:outline-none focus:ring-4 focus:ring-dim-grey-200 disabled:cursor-wait disabled:opacity-70 hover:cursor-pointer"
              >
                {isSubmitting ? "Signing in…" : "Sign in to CaseSignal"}
              </button>
            </form>
            <p className="mt-6 text-sm leading-6 text-dim-grey-500">
              Demo credentials are prefilled for this portfolio environment.
              Authentication uses a server-side Symfony session; the password is
              verified server-side and never stored in the browser.
            </p>
          </motion.div>
        </section>
      </div>
    </main>
  );
}

function Value({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-ash-grey-300/20 bg-ash-grey-50/10 p-4 backdrop-blur-sm">
      <p className="text-xs font-semibold tracking-[0.12em] text-ash-grey-200 uppercase">
        {label}
      </p>
      <p className="mt-2 font-semibold">{value}</p>
    </div>
  );
}
