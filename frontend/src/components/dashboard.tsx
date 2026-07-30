"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

type Metric = { label: string; value: number | string; change: string; tone: "amber" | "rose" | "emerald" | "indigo" };
type Exception = { id: string; title: string; customer: string; workflow: string; reason: string; priority: "High" | "Medium"; owner: string; age: string; status: string };
type WorkflowRun = { name: string; completed: number; exceptions: number };
type DashboardData = { generatedAt: string; metrics: Metric[]; exceptions: Exception[]; workflowRuns: WorkflowRun[] };

const toneStyles: Record<Metric["tone"], string> = {
  amber: "border-amber-200 bg-amber-50 text-amber-800", rose: "border-rose-200 bg-rose-50 text-rose-800", emerald: "border-emerald-200 bg-emerald-50 text-emerald-800", indigo: "border-indigo-200 bg-indigo-50 text-indigo-800",
};
const priorityStyles: Record<Exception["priority"], string> = { High: "bg-rose-100 text-rose-700", Medium: "bg-amber-100 text-amber-800" };

export function Dashboard() {
  const reduceMotion = useReducedMotion();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const apiOrigin = process.env.NEXT_PUBLIC_API_ORIGIN ?? "http://127.0.0.1:8000";
    async function loadDashboard() {
      try {
        const response = await fetch(`${apiOrigin}/api/v1/dashboard`, { headers: { Accept: "application/json" }, signal: controller.signal });
        if (!response.ok) throw new Error(`The service returned ${response.status}.`);
        setData((await response.json()) as DashboardData);
      } catch (caughtError) {
        if ((caughtError as Error).name !== "AbortError") setError("CaseSignal could not load the latest workflow data. Check that the Symfony API is running, then refresh.");
      }
    }
    void loadDashboard();
    return () => controller.abort();
  }, []);

  return <main className="min-h-screen bg-slate-50 text-slate-950"><div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
    <header className="mb-10 flex flex-col gap-6 border-b border-slate-200 pb-8 sm:flex-row sm:items-center sm:justify-between"><div><p className="mb-2 text-sm font-semibold tracking-[0.18em] text-indigo-700 uppercase">CaseSignal</p><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Workflow exception control centre</h1><p className="mt-3 max-w-2xl text-slate-600">Automation pauses safely when a case needs human judgement. Review the signal, make a decision, and keep the workflow moving.</p></div><div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm"><p className="font-medium">Operator workspace</p><p className="mt-1 text-slate-500">Synthetic demonstration data</p></div></header>
    {error ? <div role="alert" className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div> : null}
    {!data && !error ? <DashboardSkeleton /> : null}
    {data ? <DashboardContent data={data} reduceMotion={reduceMotion ?? false} /> : null}
  </div></main>;
}

function DashboardContent({ data, reduceMotion }: { data: DashboardData; reduceMotion: boolean }) {
  return <div className="space-y-8"><section aria-label="Workflow overview" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{data.metrics.map((metric, index) => <motion.article key={metric.label} initial={reduceMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduceMotion ? 0 : index * 0.06, duration: 0.25 }} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-medium text-slate-600">{metric.label}</p><p className="mt-3 text-3xl font-semibold tracking-tight">{metric.value}</p><span className={`mt-4 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${toneStyles[metric.tone]}`}>{metric.change}</span></motion.article>)}</section>
    <section className="grid gap-8 xl:grid-cols-[1.7fr_0.9fr]"><div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5"><div><h2 className="text-lg font-semibold">Exception queue</h2><p className="mt-1 text-sm text-slate-600">Cases that require a human decision before automation can continue.</p></div><span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700">{data.exceptions.length} active</span></div><div className="divide-y divide-slate-100">{data.exceptions.map((exception) => <article key={exception.id} className="px-6 py-5 transition-colors hover:bg-slate-50"><div className="flex flex-col justify-between gap-4 sm:flex-row"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{exception.title}</h3><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${priorityStyles[exception.priority]}`}>{exception.priority}</span></div><p className="mt-1 text-sm text-slate-600">{exception.id} · {exception.customer} · {exception.workflow}</p><p className="mt-3 text-sm leading-6 text-slate-700">{exception.reason}</p></div><dl className="min-w-35 text-sm sm:text-right"><dt className="text-slate-500">{exception.status}</dt><dd className="mt-1 font-medium">{exception.owner}</dd><dd className="mt-1 text-slate-500">{exception.age}</dd></dl></div></article>)}</div></div>
      <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-semibold">Workflow activity</h2><p className="mt-1 text-sm text-slate-600">A simple view of automated work and the signals requiring review.</p><div className="mt-6 space-y-5">{data.workflowRuns.map((workflow) => <div key={workflow.name}><div className="flex justify-between gap-4 text-sm"><span className="font-medium">{workflow.name}</span><span className="text-slate-500">{workflow.completed} completed</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-600" style={{ width: `${Math.min(100, 100 - workflow.exceptions * 5)}%` }} /></div><p className="mt-2 text-xs text-slate-500">{workflow.exceptions} exception{workflow.exceptions === 1 ? "" : "s"} requiring review</p></div>)}</div><div className="mt-8 rounded-xl bg-slate-950 p-4 text-slate-50"><p className="text-sm font-semibold">Guardrail active</p><p className="mt-1 text-sm leading-6 text-slate-300">Low-confidence extraction and approval-threshold decisions remain with a person.</p></div></aside>
    </section></div>;
}

function DashboardSkeleton() { return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Loading workflow dashboard">{[1, 2, 3, 4].map((item) => <div key={item} className="h-38 animate-pulse rounded-2xl bg-slate-200" />)}</div>; }
