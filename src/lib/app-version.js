// The id of this build (set in vite.config.js), the same in the browser code and on the server.
export const APP_VERSION = import.meta.env.APP_VERSION || "dev";

const RELOAD_KEY = "sysi:last-version-reload";

// Reloads the page to pick up a new deployment, at most once every 30 seconds, so a deployment
// that is still starting up can never trap the page in a reload loop. Browser only.
export function reloadForNewVersion(href) {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY)) || 0;
    if (Date.now() - last < 30_000) return false;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    // Storage blocked: reload anyway.
  }
  if (href) window.location.assign(href);
  else window.location.reload();
  return true;
}

// The error a browser throws when a page's code file is gone, which happens to a tab opened
// before a deployment (each build replaces the files in /assets/).
export function isMissingCodeError(error) {
  const message = String(error?.message || error || "");
  return /dynamically imported module|Importing a module script failed|Unable to preload|Failed to load module script/i.test(
    message,
  );
}
