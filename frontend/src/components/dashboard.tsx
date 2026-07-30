"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { apiFetch, AuthenticatedUser } from "@/lib/api";

type Metric = {
  label: string;
  value: number | string;
  change: string;
  tone: "amber" | "rose" | "emerald" | "indigo";
};
type Exception = {
  id: string;
  title: string;
  customer: string;
  workflow: string;
  reason: string;
  priority: "High" | "Medium";
  owner: string;
  age: string;
  status: string;
};
type WorkflowRun = { name: string; completed: number; exceptions: number };
type DashboardData = {
  generatedAt: string;
  metrics: Metric[];
  exceptions: Exception[];
  workflowRuns: WorkflowRun[];
};
type Filter = "all" | "high" | "mine";

const toneStyles: Record<Metric["tone"], string> = {
  amber: "border-pale-slate-200 bg-pale-slate-50 text-pale-slate-800 dark:border-dim-grey-600 dark:bg-dim-grey-800 dark:text-pale-slate-200",
  rose: "border-black-cherry-200 bg-black-cherry-50 text-black-cherry-800 dark:border-deep-crimson-700 dark:bg-deep-crimson-950 dark:text-deep-crimson-100",
  emerald: "border-onyx-200 bg-onyx-50 text-onyx-800 dark:border-onyx-700 dark:bg-onyx-950 dark:text-onyx-100",
  indigo: "border-pale-slate-200 bg-pale-slate-50 text-pale-slate-800 dark:border-dim-grey-600 dark:bg-dim-grey-800 dark:text-pale-slate-200",
};
const priorityStyles: Record<Exception["priority"], string> = {
  High: "bg-black-cherry-100 text-black-cherry-800 dark:bg-deep-crimson-900 dark:text-deep-crimson-100",
  Medium: "bg-pale-slate-100 text-pale-slate-800 dark:bg-dim-grey-800 dark:text-pale-slate-200",
};

export function Dashboard() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [data, setData] = useState<DashboardData | null>(null);
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    const controller = new AbortController();
    async function loadDashboard() {
      const [meResponse, dashboardResponse] = await Promise.all([
        apiFetch("/api/v1/auth/me", { signal: controller.signal }),
        apiFetch("/api/v1/dashboard", { signal: controller.signal }),
      ]);
      if (meResponse.status === 401 || dashboardResponse.status === 401) {
        router.replace("/");
        return;
      }
      if (!meResponse.ok || !dashboardResponse.ok) {
        setError(
          "CaseSignal could not load the latest workflow data. Refresh the page to try again.",
        );
        return;
      }
      const [{ user: currentUser }, dashboard] = await Promise.all([
        meResponse.json() as Promise<{ user: AuthenticatedUser }>,
        dashboardResponse.json() as Promise<DashboardData>,
      ]);
      setUser(currentUser);
      setData(dashboard);
    }
    void loadDashboard().catch((caughtError) => {
      if ((caughtError as Error).name !== "AbortError")
        setError(
          "CaseSignal could not load the latest workflow data. Refresh the page to try again.",
        );
    });
    return () => controller.abort();
  }, [router]);

  async function logout() {
    await apiFetch("/api/v1/auth/logout", { method: "POST" });
    router.replace("/");
  }

  const exceptions = useMemo(
    () =>
      data?.exceptions.filter(
        (exception) =>
          filter === "all" ||
          (filter === "high" && exception.priority === "High") ||
          (filter === "mine" && exception.owner === user?.name),
      ) ?? [],
    [data, filter, user],
  );

  if (!data || !user) return <DashboardSkeleton error={error} />;
  return (
    <main className="min-h-screen bg-pale-slate-50 text-dim-grey-900 dark:bg-dim-grey-950 dark:text-pale-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <header className="mb-10 flex flex-col gap-6 border-b border-pale-slate-200 pb-8 dark:border-dim-grey-700 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold tracking-[0.18em] text-pale-slate-700 uppercase dark:text-pale-slate-300">
              CaseSignal
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Good morning, {user.name.split(" ")[0]}
            </h1>
            <p className="mt-3 max-w-2xl text-dim-grey-600 dark:text-pale-slate-300">
              You have {data.metrics[0].value} workflow signals awaiting review.
              Your decisions are tracked and each workflow stays protected.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-pale-slate-200 bg-pale-slate-50 p-3 shadow-sm dark:border-dim-grey-700 dark:bg-dim-grey-900">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-pale-slate-100 text-sm font-bold text-pale-slate-700 dark:bg-dim-grey-800 dark:text-pale-slate-200">
              {user.initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user.name}</p>
              <p className="truncate text-xs text-dim-grey-500 dark:text-pale-slate-400">{user.role}</p>
            </div>
            <button
              onClick={() => void logout()}
              className="ml-2 rounded-lg px-2 py-1 text-sm font-medium text-dim-grey-600 hover:cursor-pointer hover:bg-pale-slate-100 hover:text-dim-grey-950 dark:text-pale-slate-300 dark:hover:bg-dim-grey-800 dark:hover:text-pale-slate-50"
            >
              Sign out
            </button>
          </div>
        </header>
        <section
          aria-label="Workflow overview"
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          {data.metrics.map((metric, index) => (
            <motion.article
              key={metric.label}
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: reduceMotion ? 0 : index * 0.06,
                duration: 0.25,
              }}
              className="rounded-2xl border border-pale-slate-200 bg-pale-slate-50 p-5 shadow-sm dark:border-dim-grey-700 dark:bg-dim-grey-900"
            >
              <p className="text-sm font-medium text-dim-grey-600 dark:text-pale-slate-300">
                {metric.label}
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-tight">
                {metric.value}
              </p>
              <span
                className={`mt-4 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${toneStyles[metric.tone]}`}
              >
                {metric.change}
              </span>
            </motion.article>
          ))}
        </section>
        <section className="mt-8 grid gap-8 xl:grid-cols-[1.7fr_0.9fr]">
          <div className="overflow-hidden rounded-2xl border border-pale-slate-200 bg-pale-slate-50 shadow-sm dark:border-dim-grey-700 dark:bg-dim-grey-900">
            <div className="flex flex-col gap-4 border-b border-pale-slate-200 px-6 py-5 dark:border-dim-grey-700 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold">Exception queue</h2>
                <p className="mt-1 text-sm text-dim-grey-600 dark:text-pale-slate-300">
                  Cases that require a human decision before automation can
                  continue.
                </p>
              </div>
              <div
                className="flex rounded-lg bg-pale-slate-100 p-1 text-sm dark:bg-dim-grey-800"
                aria-label="Exception filters"
              >
                {(
                  [
                    ["all", "All"],
                    ["high", "High priority"],
                    ["mine", "My queue"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => setFilter(value)}
                    className={`rounded-md px-3 py-1.5 font-medium transition ${filter === value ? "bg-pale-slate-50 text-dim-grey-900 shadow-sm dark:bg-dim-grey-700 dark:text-pale-slate-50" : "text-dim-grey-600 hover:cursor-pointer hover:text-dim-grey-950 hover:underline hover:underline-offset-2 dark:text-pale-slate-400 dark:hover:text-pale-slate-50"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="divide-y divide-pale-slate-100 dark:divide-dim-grey-800">
              {exceptions.length ? (
                exceptions.map((exception) => (
                  <article
                    key={exception.id}
                    className="px-6 py-5 transition-colors hover:bg-pale-slate-100 dark:hover:bg-dim-grey-800"
                  >
                    <div className="flex flex-col justify-between gap-4 sm:flex-row">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold">{exception.title}</h3>
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${priorityStyles[exception.priority]}`}
                          >
                            {exception.priority}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-dim-grey-600 dark:text-pale-slate-300">
                          {exception.id} · {exception.customer} ·{" "}
                          {exception.workflow}
                        </p>
                        <p className="mt-3 text-sm leading-6 text-dim-grey-700 dark:text-pale-slate-200">
                          {exception.reason}
                        </p>
                      </div>
                      <dl className="min-w-35 text-sm sm:text-right">
                        <dt className="text-dim-grey-500 dark:text-pale-slate-400">{exception.status}</dt>
                        <dd className="mt-1 font-medium">{exception.owner}</dd>
                        <dd className="mt-1 text-dim-grey-500 dark:text-pale-slate-400">{exception.age}</dd>
                      </dl>
                    </div>
                  </article>
                ))
              ) : (
                <p className="px-6 py-12 text-center text-sm text-dim-grey-500 dark:text-pale-slate-400">
                  No exceptions match this filter.
                </p>
              )}
            </div>
          </div>
          <aside className="rounded-2xl border border-pale-slate-200 bg-pale-slate-50 p-6 shadow-sm dark:border-dim-grey-700 dark:bg-dim-grey-900">
            <h2 className="text-lg font-semibold">Workflow activity</h2>
            <p className="mt-1 text-sm text-dim-grey-600 dark:text-pale-slate-300">
              A simple view of automated work and the signals requiring review.
            </p>
            <div className="mt-6 space-y-5">
              {data.workflowRuns.map((workflow) => (
                <div key={workflow.name}>
                  <div className="flex justify-between gap-4 text-sm">
                    <span className="font-medium">{workflow.name}</span>
                    <span className="text-dim-grey-500 dark:text-pale-slate-400">
                      {workflow.completed} completed
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-pale-slate-100 dark:bg-dim-grey-800">
                    <div
                      className="h-full rounded-full bg-pale-slate-600 dark:bg-pale-slate-400"
                      style={{
                        width: `${Math.min(100, 100 - workflow.exceptions * 5)}%`,
                      }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-dim-grey-500 dark:text-pale-slate-400">
                    {workflow.exceptions} exception
                    {workflow.exceptions === 1 ? "" : "s"} requiring review
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-8 rounded-xl bg-dim-grey-950 p-4 text-dim-grey-50 dark:bg-dim-grey-800">
              <p className="text-sm font-semibold">Guardrail active</p>
              <p className="mt-1 text-sm leading-6 text-dim-grey-200 dark:text-pale-slate-300">
                Low-confidence extraction and approval-threshold decisions
                remain with a person.
              </p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

function DashboardSkeleton({ error }: { error: string | null }) {
  return (
    <main className="min-h-screen bg-pale-slate-50 px-6 py-8 dark:bg-dim-grey-950">
      <div className="mx-auto max-w-7xl">
        {error ? (
          <p
            role="alert"
            className="rounded-xl border border-black-cherry-200 bg-black-cherry-50 px-4 py-3 text-sm text-black-cherry-800 dark:border-deep-crimson-700 dark:bg-deep-crimson-950 dark:text-deep-crimson-100"
          >
            {error}
          </p>
        ) : (
          <div
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
            aria-label="Loading workflow dashboard"
          >
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-36 animate-pulse rounded-2xl bg-pale-slate-200 dark:bg-dim-grey-800"
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
