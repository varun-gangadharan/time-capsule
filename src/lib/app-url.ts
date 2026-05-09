const configuredAppUrl = import.meta.env.VITE_PUBLIC_APP_URL;

export const appUrl =
  typeof configuredAppUrl === "string" && configuredAppUrl.trim()
    ? configuredAppUrl.trim().replace(/\/+$/, "")
    : window.location.origin;

