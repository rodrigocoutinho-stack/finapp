"use client";

import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import {
  GOAL_ICONS,
  GOAL_COLORS,
  getGoalProgress,
  getGoalProgressPercent,
  getGoalStatus,
} from "@/lib/goal-utils";
import type { Goal, Account } from "@/types/database";

interface GoalsSummaryProps {
  goals: Goal[];
  accounts: Account[];
}

const statusDot = {
  green: "bg-emerald-500",
  yellow: "bg-yellow-500",
  red: "bg-rose-500",
  gray: "bg-on-surface-muted",
};

export function GoalsSummary({ goals, accounts }: GoalsSummaryProps) {
  if (goals.length === 0) return null;

  // Show up to 3 active goals sorted by priority
  const topGoals = goals
    .filter((g) => g.is_active)
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 3);

  if (topGoals.length === 0) return null;

  return (
    <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-emerald-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5"
            />
          </svg>
          <h2 className="text-lg font-semibold text-on-surface-heading">Metas</h2>
        </div>
        <Link
          href="/metas"
          className="text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-300 transition-colors"
        >
          Ver todas &rarr;
        </Link>
      </div>

      <div className="space-y-3">
        {topGoals.map((goal) => {
          const colorKey = goal.color in GOAL_COLORS ? goal.color : "emerald";
          const colorStyles = GOAL_COLORS[colorKey];
          const iconEmoji = GOAL_ICONS[goal.icon] ?? GOAL_ICONS.default;
          const progress = getGoalProgressPercent(goal, accounts);
          const currentCents = getGoalProgress(goal, accounts);
          const status = getGoalStatus(goal, accounts);

          return (
            <div
              key={goal.id}
              className="flex items-center gap-3 rounded-lg bg-surface-alt px-3 py-2.5"
            >
              <span className="text-lg shrink-0">{iconEmoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <p className="text-sm font-medium text-on-surface-secondary truncate">
                    {goal.name}
                  </p>
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDot[status.color]}`}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-skeleton rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${colorStyles.bar}`}
                      style={{ width: `${Math.min(100, progress)}%` }}
                    />
                  </div>
                  <span className="text-xs text-on-surface-muted tabular-nums shrink-0">
                    {progress.toFixed(0)}%
                  </span>
                </div>
                <p className="text-xs text-on-surface-muted mt-0.5">
                  {formatCurrency(currentCents)} / {formatCurrency(goal.target_cents)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
