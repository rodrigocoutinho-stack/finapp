"use client";

import { usePreferences } from "@/contexts/preferences-context";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function getFormattedDate(): string {
  return new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function GreetingHeader() {
  const { fullName } = usePreferences();
  const firstName = fullName ? fullName.split(" ")[0] : "";
  const greeting = getGreeting();
  const dateStr = getFormattedDate();

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">
        {greeting}
        {firstName ? `, ${firstName}` : ""}
      </h1>
      <p className="text-slate-500 text-sm mt-1 capitalize">{dateStr}</p>
    </div>
  );
}
