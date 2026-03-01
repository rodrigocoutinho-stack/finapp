"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface ChartColors {
  grid: string;
  text: string;
  emerald: string;
  rose: string;
  blue: string;
  violet: string;
  orange: string;
  red: string;
  muted: string;
  tooltip: { bg: string; border: string };
}

const lightColors: ChartColors = {
  grid: "#e2e8f0",
  text: "#64748b",
  emerald: "#10b981",
  rose: "#f43f5e",
  blue: "#3b82f6",
  violet: "#8b5cf6",
  orange: "#f97316",
  red: "#dc2626",
  muted: "#94a3b8",
  tooltip: { bg: "#ffffff", border: "#e2e8f0" },
};

const darkColors: ChartColors = {
  grid: "#334155",
  text: "#94a3b8",
  emerald: "#34d399",
  rose: "#fb7185",
  blue: "#60a5fa",
  violet: "#a78bfa",
  orange: "#fb923c",
  red: "#f87171",
  muted: "#64748b",
  tooltip: { bg: "#1e293b", border: "#334155" },
};

export function useChartColors(): ChartColors {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return lightColors;
  return resolvedTheme === "dark" ? darkColors : lightColors;
}
