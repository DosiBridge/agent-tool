/**
 * Runtime Config Loader
 * Preloads the API base URL from runtime config before the app makes any API calls
 */

"use client";

import { getApiBaseUrl } from "@/lib/api/client";
import { useEffect } from "react";

export default function RuntimeConfigLoader() {
  useEffect(() => {
    // Only run on client side to avoid hydration mismatches
    if (typeof window === "undefined") return;

    // Preload the API base URL as soon as the component mounts
    getApiBaseUrl()
      .then(() => {
        // Runtime config preloaded successfully
      })
      .catch((error) => {
        console.error("✗ Failed to preload runtime config:", error);
      });
  }, []);

  // This component doesn't render anything, it just preloads the config
  return null;
}
