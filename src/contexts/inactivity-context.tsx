"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const WARNING_BEFORE_LOGOUT_MS = 60 * 1000; // 60s countdown
const INACTIVITY_TIMEOUT_MS = 29 * 60 * 1000; // 29 min until warning
const STORAGE_KEY = "finapp_last_activity";
const TRACKED_EVENTS: (keyof WindowEventMap)[] = [
  "mousemove",
  "click",
  "keydown",
  "scroll",
  "touchstart",
];

interface InactivityContextValue {
  showWarning: boolean;
  remainingSeconds: number;
  dismissWarning: () => void;
}

const InactivityContext = createContext<InactivityContextValue | null>(null);

export function InactivityProvider({ children }: { children: React.ReactNode }) {
  const [showWarning, setShowWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(60);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastThrottleRef = useRef(0);
  const router = useRouter();

  const clearAllTimers = useCallback(() => {
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  const performLogout = useCallback(async () => {
    clearAllTimers();
    setShowWarning(false);
    localStorage.removeItem(STORAGE_KEY);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }, [clearAllTimers, router]);

  const startCountdown = useCallback(() => {
    setRemainingSeconds(60);
    setShowWarning(true);

    countdownRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          performLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    logoutTimerRef.current = setTimeout(() => {
      performLogout();
    }, WARNING_BEFORE_LOGOUT_MS);
  }, [performLogout]);

  const resetTimer = useCallback(() => {
    clearAllTimers();
    setShowWarning(false);
    setRemainingSeconds(60);

    localStorage.setItem(STORAGE_KEY, Date.now().toString());

    warningTimerRef.current = setTimeout(() => {
      startCountdown();
    }, INACTIVITY_TIMEOUT_MS);
  }, [clearAllTimers, startCountdown]);

  const dismissWarning = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  // Check auth on mount
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setIsAuthenticated(true);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Set up timers and listeners when authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      clearAllTimers();
      return;
    }

    // Check localStorage for existing activity timestamp
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const elapsed = Date.now() - parseInt(stored, 10);
      if (elapsed >= INACTIVITY_TIMEOUT_MS + WARNING_BEFORE_LOGOUT_MS) {
        // Already expired — logout immediately
        performLogout();
        return;
      } else if (elapsed >= INACTIVITY_TIMEOUT_MS) {
        // In warning window
        const remaining = Math.ceil(
          (INACTIVITY_TIMEOUT_MS + WARNING_BEFORE_LOGOUT_MS - elapsed) / 1000
        );
        setRemainingSeconds(remaining);
        setShowWarning(true);

        countdownRef.current = setInterval(() => {
          setRemainingSeconds((prev) => {
            if (prev <= 1) {
              performLogout();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        logoutTimerRef.current = setTimeout(() => {
          performLogout();
        }, remaining * 1000);
        return;
      }
      // Still active — set timer for remaining time
      const remainingTimeout = INACTIVITY_TIMEOUT_MS - elapsed;
      warningTimerRef.current = setTimeout(() => {
        startCountdown();
      }, remainingTimeout);
    } else {
      // First time — start fresh
      resetTimer();
    }

    function handleActivity() {
      const now = Date.now();
      if (now - lastThrottleRef.current < 1000) return;
      lastThrottleRef.current = now;
      resetTimer();
    }

    for (const event of TRACKED_EVENTS) {
      window.addEventListener(event, handleActivity, { passive: true });
    }

    return () => {
      for (const event of TRACKED_EVENTS) {
        window.removeEventListener(event, handleActivity);
      }
      clearAllTimers();
    };
  }, [isAuthenticated, clearAllTimers, performLogout, resetTimer, startCountdown]);

  return (
    <InactivityContext.Provider value={{ showWarning, remainingSeconds, dismissWarning }}>
      {children}
    </InactivityContext.Provider>
  );
}

export function useInactivity() {
  const context = useContext(InactivityContext);
  if (!context) {
    throw new Error("useInactivity must be used within an InactivityProvider");
  }
  return context;
}
