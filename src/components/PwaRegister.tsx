'use client';

import { useEffect } from 'react';

export function PwaRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    if (process.env.NODE_ENV !== 'production') {
      // Prevent a previously installed production worker from serving stale
      // bundles while developing on the same localhost origin.
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
        .catch((error: unknown) => {
          console.warn('CourtFlow development service worker cleanup failed:', error);
        });
      return;
    }

    navigator.serviceWorker.register('/sw.js').catch((error: unknown) => {
      console.warn('CourtFlow service worker registration failed:', error);
    });
  }, []);

  return null;
}
