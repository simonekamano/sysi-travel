import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import { APP_VERSION, reloadForNewVersion } from "@/lib/app-version";

const CHECK_EVERY = 5 * 60 * 1000;
// A navigation or a return to the tab checks again only if the last check is older than this.
const MIN_GAP = 30 * 1000;

// Moves open tabs to a new deployment without anyone having to refresh. The browser keeps the
// code it loaded first, so it compares its build id with the server's (/api/version) every few
// minutes, on navigation and when the tab comes back into view. Once outdated:
// - the next click on a link loads that page in full, from the new version;
// - coming back to the tab reloads it, unless the visitor has typed into a form on this page.
// Renders nothing.
export function UpdateWatcher() {
  const router = useRouter();

  useEffect(() => {
    if (import.meta.env.DEV) return undefined;

    let outdated = false;
    let lastCheck = Date.now();
    let typed = false;

    const check = async () => {
      if (outdated) return;
      lastCheck = Date.now();
      try {
        const response = await fetch("/api/version", { cache: "no-store" });
        if (!response.ok) return;
        const { version } = await response.json();
        if (version && version !== APP_VERSION) outdated = true;
      } catch {
        // Offline or the server is restarting: the next check will tell.
      }
    };
    const checkIfDue = () => (Date.now() - lastCheck > MIN_GAP ? check() : Promise.resolve());

    const onVisible = async () => {
      if (document.visibilityState !== "visible") return;
      await checkIfDue();
      if (outdated && !typed) reloadForNewVersion();
    };
    const onInput = () => {
      typed = true;
    };
    // A page's code file is gone: this tab is from before a deployment.
    const onMissingFile = () => {
      outdated = true;
    };

    const stopBefore = router.subscribe("onBeforeNavigate", ({ toLocation, pathChanged }) => {
      if (outdated && pathChanged && reloadForNewVersion(toLocation.href)) return;
      checkIfDue();
    });
    const stopResolved = router.subscribe("onResolved", ({ pathChanged }) => {
      if (pathChanged) typed = false;
    });
    const timer = window.setInterval(check, CHECK_EVERY);
    document.addEventListener("visibilitychange", onVisible);
    document.addEventListener("input", onInput, true);
    window.addEventListener("vite:preloadError", onMissingFile);

    return () => {
      stopBefore();
      stopResolved();
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      document.removeEventListener("input", onInput, true);
      window.removeEventListener("vite:preloadError", onMissingFile);
    };
  }, [router]);

  return null;
}
