"use client";

import { useEffect, useState } from "react";
import { ArrowRightIcon, Eclipse } from "lucide-react";
import Link from "next/link";

type ApiKeyStatusResponse = {
  authenticated: boolean;
  hasAnyKey: boolean;
  error?: string;
};

const Banner = () => {
  const [status, setStatus] = useState<ApiKeyStatusResponse | null>(null);
  const [hasDismissed, setHasDismissed] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadStatus = async () => {
      try {
        const response = await fetch("/api/api-keys/status", {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          if (!isMounted) {
            return;
          }
          setStatus({
            authenticated: false,
            hasAnyKey: false,
          });
          return;
        }

        const data = (await response.json()) as ApiKeyStatusResponse;
        if (!isMounted) {
          return;
        }
        setStatus(data);
      } catch (error) {
        console.error("Failed to load API key status:", error);
        if (!isMounted) {
          return;
        }
        setStatus({
          authenticated: false,
          hasAnyKey: false,
          error: "Failed to check API key status.",
        });
      }
    };

    loadStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!status || hasDismissed) {
    return null;
  }

  if (!status.authenticated || status.hasAnyKey) {
    return null;
  }

  const handleDismiss = () => {
    setHasDismissed(true);
  };

  return (
    <div className="bg-muted px-4 py-3 text-foreground">
      <div className="flex flex-col justify-between gap-2 md:flex-row">
        <div className="flex grow gap-3">
          <Eclipse
            className="mt-0.5 shrink-0 opacity-60"
            size={16}
            aria-hidden="true"
          />
          <div className="flex grow flex-col justify-between gap-2 md:flex-row md:items-center">
            <p className="text-sm">
              We had an internal issue with API key storage and cleared existing
              keys. Please re-enter your API key in Settings to keep using AI
              tools like the Email Rewriter.
            </p>
            <div className="mt-2 flex gap-2 md:mt-0 md:items-center">
              <Link
                href="/settings"
                className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2"
                aria-label="Go to Settings to add your API key"
              >
                Open Settings
                <ArrowRightIcon className="ml-1 h-3 w-3" aria-hidden="true" />
              </Link>
              <button
                type="button"
                onClick={handleDismiss}
                className="text-xs text-muted-foreground underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2"
                aria-label="Dismiss API key notice banner"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Banner;
