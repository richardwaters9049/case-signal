"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { apiFetch, AuthenticatedUser, responseMessage } from "@/lib/api";
import { ThemeToggle } from "@/components/theme-toggle";

type Metric = {
  label: string;
  value: number | string;
  change: string;
  tone: "amber" | "rose" | "emerald" | "indigo";
};
type AuditEvent = { at: string; actor: string; event: string; note: string };
type WorkflowCase = {
  id: string;
  title: string;
  customer: string;
  workflow: string;
  reason: string;
  priority: "High" | "Medium";
  owner: string;
  age: string;
  status: string;
  confidence: string;
  evidence: string;
  source: string;
  createdAt: string;
  updatedAt: string;
  audit: AuditEvent[];
};
type WorkflowRun = { name: string; completed: number; exceptions: number };
type DashboardData = {
  generatedAt: string;
  metrics: Metric[];
  exceptions: WorkflowCase[];
  workflowRuns: WorkflowRun[];
};
type Filter = "all" | "high" | "mine";
type CaseAction = "approve" | "request_information" | "reject" | "retry";

const toneStyles: Record<Metric["tone"], string> = {
  amber:
    "border-review-yellow-200 bg-review-yellow-50 text-review-yellow-800 dark:border-review-yellow-700 dark:bg-review-yellow-950 dark:text-review-yellow-100",
  rose: "border-black-cherry-200 bg-black-cherry-50 text-black-cherry-800 dark:border-deep-crimson-700 dark:bg-deep-crimson-950 dark:text-deep-crimson-100",
  emerald:
    "border-onyx-200 bg-onyx-50 text-onyx-800 dark:border-onyx-700 dark:bg-onyx-950 dark:text-onyx-100",
  indigo:
    "border-pale-slate-200 bg-pale-slate-50 text-pale-slate-800 dark:border-dim-grey-600 dark:bg-dim-grey-800 dark:text-pale-slate-200",
};
const priorityStyles: Record<WorkflowCase["priority"], string> = {
  High: "bg-black-cherry-100 text-black-cherry-800 dark:bg-deep-crimson-900 dark:text-deep-crimson-100",
  Medium:
    "bg-pale-slate-100 text-pale-slate-800 dark:bg-dim-grey-800 dark:text-pale-slate-200",
};
const statusStyles: Record<string, string> = {
  Resolved:
    "border-onyx-200 bg-onyx-50 text-onyx-800 dark:border-onyx-700 dark:bg-onyx-950 dark:text-onyx-100",
  Rejected:
    "border-black-cherry-200 bg-black-cherry-50 text-black-cherry-800 dark:border-deep-crimson-700 dark:bg-deep-crimson-950 dark:text-deep-crimson-100",
};
const reviewStatusStyle =
  "border-review-yellow-200 bg-review-yellow-50 text-review-yellow-800 dark:border-review-yellow-700 dark:bg-review-yellow-950 dark:text-review-yellow-100";
const actionLabels: Record<CaseAction, string> = {
  approve: "Approve & resume",
  request_information: "Request information",
  reject: "Reject case",
  retry: "Retry safely",
};

export function Dashboard() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [data, setData] = useState<DashboardData | null>(null);
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [selectedCase, setSelectedCase] = useState<WorkflowCase | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [note, setNote] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isActing, setIsActing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

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
        throw new Error("CaseSignal could not load the latest workflow data.");
      }
      const [{ user: currentUser }, dashboard] = await Promise.all([
        meResponse.json() as Promise<{ user: AuthenticatedUser }>,
        dashboardResponse.json() as Promise<DashboardData>,
      ]);
      setUser(currentUser);
      setData(dashboard);
      setSelectedCase((current) =>
        current
          ? (dashboard.exceptions.find(
            (workflowCase) => workflowCase.id === current.id,
          ) ?? null)
          : (dashboard.exceptions.find(
            (workflowCase) => !isClosed(workflowCase),
          ) ??
            dashboard.exceptions[0] ??
            null),
      );
    }
    void loadDashboard().catch((caughtError) => {
      if ((caughtError as Error).name !== "AbortError")
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "CaseSignal could not load the latest workflow data.",
        );
    });
    return () => controller.abort();
  }, [router]);

  const exceptions = useMemo(
    () =>
      data?.exceptions.filter(
        (workflowCase) =>
          filter === "all" ||
          (filter === "high" && workflowCase.priority === "High") ||
          (filter === "mine" && workflowCase.owner === user?.name),
      ) ?? [],
    [data, filter, user],
  );

  async function selectCase(caseId: string) {
    const response = await apiFetch(`/api/v1/cases/${caseId}`);
    if (!response.ok) {
      setError(await responseMessage(response));
      return;
    }
    const payload = (await response.json()) as { case: WorkflowCase };
    setSelectedCase(payload.case);
    setNotice(null);
    setError(null);
  }

  async function act(action: CaseAction) {
    if (!selectedCase) return;
    setIsActing(true);
    setNotice(null);
    setError(null);
    try {
      const response = await apiFetch(
        `/api/v1/cases/${selectedCase.id}/actions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, note }),
        },
      );
      if (!response.ok) throw new Error(await responseMessage(response));
      const payload = (await response.json()) as {
        case: WorkflowCase;
        message: string;
      };
      const dashboardResponse = await apiFetch("/api/v1/dashboard");
      if (!dashboardResponse.ok)
        throw new Error(await responseMessage(dashboardResponse));
      setData((await dashboardResponse.json()) as DashboardData);
      setSelectedCase(payload.case);
      setNote("");
      setNotice(payload.message);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "CaseSignal could not update this workflow.",
      );
    } finally {
      setIsActing(false);
    }
  }

  async function logout() {
    await apiFetch("/api/v1/auth/logout", { method: "POST" });
    router.replace("/");
  }

  async function resetDemoData() {
    setIsResetting(true);
    setNotice(null);
    setError(null);
    try {
      const response = await apiFetch("/api/v1/demo/reset", { method: "POST" });
      if (!response.ok) throw new Error(await responseMessage(response));
      const payload = (await response.json()) as {
        message: string;
        dashboard: DashboardData;
      };
      setData(payload.dashboard);
      setSelectedCase(
        payload.dashboard.exceptions.find((workflowCase) => !isClosed(workflowCase)) ??
          payload.dashboard.exceptions[0] ??
          null,
      );
      setNote("");
      setNotice(payload.message);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "CaseSignal could not reset the demonstration data.",
      );
    } finally {
      setIsResetting(false);
    }
  }

  if (!data || !user) return <DashboardSkeleton error={error} />;
  return (
    <main className="min-h-screen bg-pale-slate-50 text-dim-grey-900 dark:bg-dim-grey-950 dark:text-pale-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <header className="mb-8 grid gap-5 border-b border-pale-slate-200 pb-7 dark:border-dim-grey-700 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div>
            <p className="mb-2 text-sm font-semibold tracking-[0.18em] text-pale-slate-700 uppercase dark:text-pale-slate-300">
              CaseSignal / Operations
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Control the exceptions, not the whole process.
            </h1>
            <p className="mt-3 max-w-2xl text-dim-grey-600 dark:text-pale-slate-300">
              {user.name.split(" ")[0]}, you have an authenticated operational
              view of every held workflow and the evidence behind it.
            </p>
          </div>
          <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-2xl border border-pale-slate-200 bg-pale-slate-50 p-3 shadow-sm dark:border-dim-grey-700 dark:bg-dim-grey-900">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-pale-slate-100 text-sm font-bold text-pale-slate-700 dark:bg-dim-grey-800 dark:text-pale-slate-200">
              {user.initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user.name}</p>
              <p className="truncate text-xs text-dim-grey-500 dark:text-pale-slate-400">
                {user.role}
              </p>
            </div>
            <div className="col-span-2 grid grid-cols-1 gap-1 border-t border-pale-slate-200 pt-2 sm:grid-cols-3 dark:border-dim-grey-700">
              <button
                onClick={() => void resetDemoData()}
                disabled={isResetting}
                className="rounded-lg px-2 py-1 text-sm font-medium text-dim-grey-600 hover:cursor-pointer hover:bg-pale-slate-100 hover:text-dim-grey-950 disabled:cursor-not-allowed disabled:opacity-60 dark:text-pale-slate-300 dark:hover:bg-dim-grey-800 dark:hover:text-pale-slate-50"
              >
                {isResetting ? "Resetting…" : "Reset demo"}
              </button>
              <ThemeToggle />
              <button
                onClick={() => void logout()}
                className="rounded-lg px-2 py-1 text-sm font-medium text-dim-grey-600 hover:cursor-pointer hover:bg-pale-slate-100 hover:text-dim-grey-950 dark:text-pale-slate-300 dark:hover:bg-dim-grey-800 dark:hover:text-pale-slate-50"
              >
                Sign out
              </button>
            </div>
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
        <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.75fr)]">
          <div className="overflow-hidden rounded-2xl border border-pale-slate-200 bg-pale-slate-50 shadow-sm dark:border-dim-grey-700 dark:bg-dim-grey-900">
            <div className="grid gap-4 border-b border-pale-slate-200 px-5 py-5 dark:border-dim-grey-700 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
              <div>
                <h2 className="text-lg font-semibold">Exception queue</h2>
                <p className="mt-1 text-sm text-dim-grey-600 dark:text-pale-slate-300">
                  Select a case to inspect the evidence and make a guarded
                  workflow decision.
                </p>
              </div>
              <div
                className="grid grid-cols-3 rounded-lg bg-pale-slate-100 p-1 text-sm dark:bg-dim-grey-800"
                aria-label="Exception filters"
              >
                {(
                  [
                    ["all", "All"],
                    ["high", "High"],
                    ["mine", "Mine"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => setFilter(value)}
                    className={`rounded-md px-3 py-1.5 font-medium transition ${filter === value ? "bg-pale-slate-50 text-dim-grey-900 shadow-sm dark:bg-dim-grey-700 dark:text-pale-slate-50" : "text-dim-grey-600 hover:cursor-pointer hover:text-dim-grey-950 dark:text-pale-slate-400 dark:hover:text-pale-slate-50"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="divide-y divide-pale-slate-100 dark:divide-dim-grey-800">
              {exceptions.length ? (
                exceptions.map((workflowCase) => (
                  <article
                    key={workflowCase.id}
                    className={`grid gap-4 px-5 py-5 transition-colors sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center ${selectedCase?.id === workflowCase.id ? "bg-pale-slate-100 dark:bg-dim-grey-800" : "hover:bg-pale-slate-100 dark:hover:bg-dim-grey-800"}`}
                  >
                    <div>
                      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                        <div>
                          <h3 className="font-semibold">
                            {workflowCase.title}
                          </h3>
                          <p className="mt-1 text-sm text-dim-grey-600 dark:text-pale-slate-300">
                            {workflowCase.id} · {workflowCase.customer} ·{" "}
                            {workflowCase.workflow}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${priorityStyles[workflowCase.priority]}`}
                        >
                          {workflowCase.priority}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-dim-grey-700 dark:text-pale-slate-200">
                        {workflowCase.reason}
                      </p>
                    </div>
                    <div className="grid gap-2 text-left sm:justify-items-end sm:text-right">
                      <span
                        className={`w-fit rounded-full border px-2.5 py-1 text-xs font-semibold ${caseStatusStyle(workflowCase.status)}`}
                      >
                        {workflowCase.status}
                      </span>
                      <p className="text-xs text-dim-grey-500 dark:text-pale-slate-400">
                        {workflowCase.owner} · {workflowCase.age}
                      </p>
                      <button
                        onClick={() => void selectCase(workflowCase.id)}
                        className="rounded-lg border border-pale-slate-300 px-3 py-2 text-sm font-semibold hover:cursor-pointer hover:bg-pale-slate-50 dark:border-dim-grey-600 dark:hover:bg-dim-grey-700"
                      >
                        Open workspace
                      </button>
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
          <DecisionWorkspace
            workflowCase={selectedCase}
            note={note}
            notice={notice}
            error={error}
            isActing={isActing}
            onNoteChange={setNote}
            onAction={act}
          />
        </section>
        <section className="mt-6 grid gap-4 md:grid-cols-3">
          {data.workflowRuns.map((workflow) => (
            <article
              key={workflow.name}
              className="rounded-2xl border border-pale-slate-200 bg-pale-slate-50 p-5 dark:border-dim-grey-700 dark:bg-dim-grey-900"
            >
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
                <p className="font-semibold">{workflow.name}</p>
                <span className="text-sm text-dim-grey-500 dark:text-pale-slate-400">
                  {workflow.completed} completed
                </span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-pale-slate-100 dark:bg-dim-grey-800">
                <div
                  className="h-full rounded-full bg-pale-slate-600 dark:bg-pale-slate-400"
                  style={{
                    width: `${Math.min(100, 100 - workflow.exceptions * 8)}%`,
                  }}
                />
              </div>
              <p className="mt-3 text-sm text-dim-grey-600 dark:text-pale-slate-300">
                {workflow.exceptions} active exception
                {workflow.exceptions === 1 ? "" : "s"}.
              </p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

function DecisionWorkspace({
  workflowCase,
  note,
  notice,
  error,
  isActing,
  onNoteChange,
  onAction,
}: {
  workflowCase: WorkflowCase | null;
  note: string;
  notice: string | null;
  error: string | null;
  isActing: boolean;
  onNoteChange: (value: string) => void;
  onAction: (action: CaseAction) => void;
}) {
  if (!workflowCase)
    return (
      <aside className="grid min-h-80 place-items-center rounded-2xl border border-dashed border-pale-slate-300 p-6 text-center text-sm text-dim-grey-600 dark:border-dim-grey-600 dark:text-pale-slate-300">
        Select a case from the queue to open its decision workspace.
      </aside>
    );
  const closed = isClosed(workflowCase);
  return (
    <aside className="rounded-2xl border border-pale-slate-200 bg-pale-slate-50 p-5 shadow-sm dark:border-dim-grey-700 dark:bg-dim-grey-900">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 border-b border-pale-slate-200 pb-5 dark:border-dim-grey-700">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-pale-slate-700 uppercase dark:text-pale-slate-300">
            Decision workspace
          </p>
          <h2 className="mt-2 text-xl font-semibold">{workflowCase.id}</h2>
          <p className="mt-1 text-sm text-dim-grey-600 dark:text-pale-slate-300">
            {workflowCase.title}
          </p>
        </div>
        <span
          className={`h-fit rounded-full border px-2.5 py-1 text-xs font-semibold ${caseStatusStyle(workflowCase.status)}`}
        >
          {workflowCase.status}
        </span>
      </div>
      {notice ? (
        <p
          role="status"
          className="mt-4 rounded-xl border border-onyx-200 bg-onyx-50 px-3 py-3 text-sm text-onyx-800 dark:border-onyx-700 dark:bg-onyx-950 dark:text-onyx-100"
        >
          {notice}
        </p>
      ) : null}
      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-black-cherry-200 bg-black-cherry-50 px-3 py-3 text-sm text-black-cherry-800 dark:border-deep-crimson-700 dark:bg-deep-crimson-950 dark:text-deep-crimson-100"
        >
          {error}
        </p>
      ) : null}
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Detail
          label="AI confidence"
          value={`${Math.round(Number(workflowCase.confidence) * 100)}%`}
        />
        <Detail label="Source" value={workflowCase.source} />
        <Detail label="Workflow" value={workflowCase.workflow} />
        <Detail label="Assigned to" value={workflowCase.owner} />
      </div>
      <div className="mt-5 rounded-xl bg-pale-slate-100 p-4 dark:bg-dim-grey-800">
        <p className="text-xs font-semibold tracking-[0.14em] text-dim-grey-600 uppercase dark:text-pale-slate-300">
          Evidence signal
        </p>
        <p className="mt-2 text-sm leading-6 text-dim-grey-800 dark:text-pale-slate-100">
          {workflowCase.evidence}
        </p>
      </div>
      <label className="mt-5 block text-sm font-semibold">
        Decision rationale
        <textarea
          value={note}
          onChange={(event) => onNoteChange(event.target.value)}
          maxLength={500}
          placeholder="Explain the decision for the audit trail…"
          disabled={closed || isActing}
          className="mt-2 min-h-24 w-full resize-y rounded-xl border border-pale-slate-300 bg-pale-slate-50 p-3 text-sm font-normal outline-none transition focus:border-pale-slate-600 focus:ring-4 focus:ring-pale-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-dim-grey-600 dark:bg-dim-grey-800 dark:text-pale-slate-50 dark:focus:border-pale-slate-400 dark:focus:ring-dim-grey-700"
        />
      </label>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 action-btn-div">
        <ActionButton
          action="approve"
          disabled={closed || isActing}
          onAction={onAction}
        />
        <ActionButton
          action="request_information"
          disabled={closed || isActing}
          onAction={onAction}
        />
        <ActionButton
          action="retry"
          disabled={closed || isActing}
          onAction={onAction}
        />
        <ActionButton
          action="reject"
          disabled={closed || isActing}
          onAction={onAction}
          destructive
        />
      </div>
      <div className="mt-6 border-t border-pale-slate-200 pt-5 dark:border-dim-grey-700">
        <p className="text-sm font-semibold">Audit trail</p>
        <ol className="mt-4 grid gap-4">
          {[...workflowCase.audit].reverse().map((event) => (
            <li
              key={`${event.at}-${event.event}`}
              className="grid grid-cols-[auto_minmax(0,1fr)] gap-3"
            >
              <span className="mt-1.5 h-2 w-2 rounded-full bg-onyx-500" />
              <div>
                <p className="text-sm font-medium">{event.event}</p>
                <p className="mt-1 text-xs text-dim-grey-500 dark:text-pale-slate-400">
                  {event.actor} · {formatTime(event.at)}
                </p>
                <p className="mt-1 text-sm text-dim-grey-600 dark:text-pale-slate-300">
                  {event.note}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </aside>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-pale-slate-200 p-3 dark:border-dim-grey-700">
      <p className="text-xs font-semibold tracking-[0.12em] text-dim-grey-500 uppercase dark:text-pale-slate-400">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium">{value}</p>
    </div>
  );
}
function ActionButton({
  action,
  disabled,
  destructive = false,
  onAction,
}: {
  action: CaseAction;
  disabled: boolean;
  destructive?: boolean;
  onAction: (action: CaseAction) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onAction(action)}
      disabled={disabled}
      className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${destructive ? "border border-black-cherry-300 text-black-cherry-800 hover:bg-black-cherry-50 dark:border-deep-crimson-700 dark:text-deep-crimson-100 dark:hover:bg-deep-crimson-950" : "bg-dim-grey-900 text-dim-grey-50 hover:bg-dim-grey-800 dark:bg-pale-slate-100 dark:text-dim-grey-950 dark:hover:bg-pale-slate-200"}`}
    >
      {actionLabels[action]}
    </button>
  );
}
function isClosed(workflowCase: WorkflowCase) {
  return ["Resolved", "Rejected"].includes(workflowCase.status);
}
function caseStatusStyle(status: string) {
  return statusStyles[status] ?? reviewStatusStyle;
}
function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    day: "numeric",
    month: "short",
  }).format(new Date(value));
}
function DashboardSkeleton({ error }: { error: string | null }) {
  return (
    <main className="min-h-screen bg-pale-slate-50 px-4 py-8 dark:bg-dim-grey-950">
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
