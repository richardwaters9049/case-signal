"use client";

import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";

const storageKey = "casesignal.theme";
const themeChangeEvent = "casesignal-theme-change";

function subscribeToTheme(listener: () => void) {
  window.addEventListener(themeChangeEvent, listener);

  return () => window.removeEventListener(themeChangeEvent, listener);
}

function currentTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function serverTheme(): Theme {
  return "light";
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useSyncExternalStore(
    subscribeToTheme,
    currentTheme,
    serverTheme,
  );

  function toggleTheme() {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    document.documentElement.style.colorScheme = nextTheme;
    window.localStorage.setItem(storageKey, nextTheme);
    window.dispatchEvent(new Event(themeChangeEvent));
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex items-center gap-2 rounded-full border border-pale-slate-300 bg-pale-slate-50 px-3 py-2 text-sm font-semibold text-dim-grey-800 shadow-lg shadow-dim-grey-950/10 transition hover:cursor-pointer hover:bg-pale-slate-100 focus:outline-none focus:ring-4 focus:ring-pale-slate-300 dark:border-dim-grey-700 dark:bg-dim-grey-900 dark:text-pale-slate-100 dark:shadow-black-cherry-950/30 dark:hover:bg-dim-grey-800 dark:focus:ring-dim-grey-700 ${className}`}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <span aria-hidden="true">{isDark ? "☀" : "◐"}</span>
      <span>{isDark ? "Light" : "Dark"}</span>
    </button>
  );
}
