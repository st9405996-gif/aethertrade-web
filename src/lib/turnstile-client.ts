// Browser-side Cloudflare Turnstile loader. The site key is public by design (VITE_ prefix).
// Only the SECRET key is server-only; it never appears in this file.
export const TURNSTILE_SITE_KEY: string | undefined =
  import.meta.env["VITE_TURNSTILE_SITE_KEY"] || undefined;
export const TURNSTILE_SCRIPT_URL =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

export interface TurnstileApi {
  render(
    element: HTMLElement,
    options: {
      sitekey: string;
      action?: string;
      callback?: (token: string) => void;
      "expired-callback"?: () => void;
      "error-callback"?: () => void;
    },
  ): string;
  reset(widgetId?: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let loading: Promise<TurnstileApi> | null = null;

export function loadTurnstile(): Promise<TurnstileApi> {
  if (typeof window === "undefined") return Promise.reject(new Error("unavailable"));
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (!loading) {
    loading = new Promise<TurnstileApi>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = TURNSTILE_SCRIPT_URL;
      script.async = true;
      script.onload = () => {
        if (window.turnstile) resolve(window.turnstile);
        else reject(new Error("unavailable"));
      };
      script.onerror = () => {
        loading = null;
        reject(new Error("unavailable"));
      };
      document.head.appendChild(script);
    });
  }
  return loading;
}
