import axios from "axios";

// API Base URL comes strictly from VITE_API_URL; nothing is hard-coded to localhost.
const API_BASE_URL = import.meta.env.VITE_API_URL || "";

type WakeListener = (isWaking: boolean) => void;
const wakeListeners = new Set<WakeListener>();
let slowRequestCount = 0;

/**
 * Subscribe to server wake-up state.
 * Triggered when any request is in flight for longer than 6 seconds (e.g. cold start).
 * Clears when the response arrives.
 */
export function subscribeServerWake(listener: WakeListener): () => void {
  wakeListeners.add(listener);
  return () => {
    wakeListeners.delete(listener);
  };
}

function notifyWake(isWaking: boolean) {
  wakeListeners.forEach((listener) => {
    try {
      listener(isWaking);
    } catch (e) {
      console.warn("Error in wakeListener:", e);
    }
  });
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 90000, // 90 seconds timeout
});

api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem("servixo_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.warn("Failed to access localStorage for token", error);
  }

  // Set 6-second timer to detect sleeping Render backend
  let timerId: ReturnType<typeof setTimeout> | null = null;
  let hasTriggered = false;

  timerId = setTimeout(() => {
    hasTriggered = true;
    slowRequestCount++;
    if (slowRequestCount === 1) {
      notifyWake(true);
    }
  }, 6000);

  (config as any).__clearWakeTimer = () => {
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
    if (hasTriggered) {
      slowRequestCount = Math.max(0, slowRequestCount - 1);
      if (slowRequestCount === 0) {
        notifyWake(false);
      }
      hasTriggered = false;
    }
  };

  return config;
});

api.interceptors.response.use(
  (response) => {
    if (typeof (response.config as any)?.__clearWakeTimer === "function") {
      (response.config as any).__clearWakeTimer();
    }
    return response;
  },
  (error) => {
    if (typeof (error.config as any)?.__clearWakeTimer === "function") {
      (error.config as any).__clearWakeTimer();
    }

    if (error.response?.status === 401) {
      const isAuthRequest = Boolean(
        error.config?.url &&
          (error.config.url.includes("/auth/login") ||
            error.config.url.includes("/auth/register") ||
            error.config.url.includes("/auth/verify-otp") ||
            error.config.url.includes("/auth/forgot-password"))
      );

      if (!isAuthRequest) {
        try {
          localStorage.removeItem("servixo_token");
          localStorage.removeItem("servixo_user");
        } catch (e) {
          console.warn("Failed to clear localStorage on 401:", e);
        }

        const isLoginPage =
          window.location.pathname === "/login" ||
          window.location.pathname.startsWith("/login");

        if (!isLoginPage) {
          window.location.href = "/login?expired=1";
        }
      }
    }

    if (error.response?.status === 403) {
      const message = error.response.data?.message;
      if (typeof message === "string" && message.toLowerCase().includes("block")) {
        try {
          localStorage.removeItem("servixo_token");
          localStorage.removeItem("servixo_user");
        } catch (e) {
          console.warn("Failed to clear localStorage on block:", e);
        }

        const isLoginPage =
          window.location.pathname === "/login" ||
          window.location.pathname.startsWith("/login");
        const isLoginRequest = Boolean(
          error.config?.url && error.config.url.includes("/auth/login")
        );

        if (!isLoginPage && !isLoginRequest) {
          window.location.href = "/login?blocked=1";
        }
      }
    }
    return Promise.reject(error);
  }
);
