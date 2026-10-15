(() => {
  const status = document.querySelector("#pwa-status");
  const banner = document.querySelector("#pwa-update");
  const updateButton = document.querySelector("#apply-pwa-update");
  const report = (message) => { status.textContent = message; status.hidden = false; };

  if (!("serviceWorker" in navigator)) {
    report("Offline support is unavailable in this browser.");
    return;
  }
  if (!window.isSecureContext) {
    report("Offline support requires HTTPS (localhost is allowed for development).");
    return;
  }

  let reloading = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });

  navigator.serviceWorker.register("/service-worker.js").then((registration) => {
    const showUpdate = () => {
      if (registration.waiting && navigator.serviceWorker.controller) banner.hidden = false;
    };
    showUpdate();
    registration.addEventListener("updatefound", () => {
      const worker = registration.installing;
      if (!worker) return;
      worker.addEventListener("statechange", () => {
        if (worker.state === "installed") showUpdate();
        if (worker.state === "redundant") report("The app update failed to install. The current version is still available.");
      });
    });
    window.addEventListener("online", () => registration.update().catch(() => {
      report("Could not check for an app update. Try again when the connection is stable.");
    }));
  }).catch(() => {
    report("Offline support could not start. The app still works while this page is open.");
  });

  updateButton.addEventListener("click", async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration("/");
      if (registration && registration.waiting) registration.waiting.postMessage("SKIP_WAITING");
      else report("No app update is waiting.");
    } catch {
      report("Could not apply the app update. Reload and try again.");
    }
  });
})();
