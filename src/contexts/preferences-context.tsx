"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";

interface PreferencesContextValue {
  closingDay: number;
  fullName: string;
  loading: boolean;
  setClosingDay: (day: number) => Promise<void>;
}

const PreferencesContext = createContext<PreferencesContextValue>({
  closingDay: 1,
  fullName: "",
  loading: true,
  setClosingDay: async () => {},
});

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const [closingDay, setClosingDayState] = useState(1);
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPreferences() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { data } = await supabase
          .from("profiles")
          .select("closing_day, full_name")
          .eq("id", user.id)
          .single();

        if (data) {
          setClosingDayState(data.closing_day);
          setFullName(data.full_name ?? "");
        }
      } catch (err) {
        console.error("Erro ao carregar preferências:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchPreferences();
  }, []);

  const setClosingDay = useCallback(
    async (day: number) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({ closing_day: day })
        .eq("id", user.id);

      if (!error) {
        setClosingDayState(day);
      }
    },
    [supabase]
  );

  return (
    <PreferencesContext.Provider value={{ closingDay, fullName, loading, setClosingDay }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesContextValue {
  return useContext(PreferencesContext);
}
