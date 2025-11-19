"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { GmailAccountManager } from "@/components/gmail/GmailAccountManager";
import { GmailSearch } from "@/components/gmail/GmailSearch";
import { toast } from "sonner";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Mail, Search, AlertCircle, CheckCircle2, Clock, Shield } from "lucide-react";

interface GmailAccount {
  id: string;
  email: string;
  created_at: string;
}

// Feature flag: Set to false until Google verification is complete
const GMAIL_TOOL_ENABLED = process.env.NEXT_PUBLIC_GMAIL_TOOL_ENABLED === "False";

export default function GmailDeliverabilityPage() {
  const searchParams = useSearchParams();
  const [ownedAccounts, setOwnedAccounts] = useState<GmailAccount[]>([]);
  const [sharedAccounts, setSharedAccounts] = useState<GmailAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (GMAIL_TOOL_ENABLED) {
      loadAccounts();
      checkQueryParams();
    } else {
      setLoading(false);
    }
  }, []);

  const checkQueryParams = () => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (success === "connected") {
      toast.success("Gmail account connected successfully!");
    }

    if (error) {
      const errorMessages: Record<string, string> = {
        unauthorized: "You must be logged in to connect Gmail accounts",
        missing_code_or_state: "OAuth callback error. Please try again.",
        invalid_state: "Security validation failed. Please try again.",
        oauth_error: "OAuth error occurred. Please try again.",
      };

      toast.error(
        errorMessages[error] || `Error: ${error.replace(/_/g, " ")}`
      );
    }
  };

  const loadAccounts = async () => {
    try {
      setLoading(true);

      // Get user ID from session
      const response = await fetch("/api/gmail/accounts");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load accounts");
      }

      setOwnedAccounts(data.owned || []);
      setSharedAccounts(data.shared || []);
    } catch (error: any) {
      console.error("Error loading accounts:", error);
      toast.error(error.message || "Failed to load Gmail accounts");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 md:py-12">
      {/* Header */}
      <div className="mb-8 space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Search className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Gmail Deliverability Viewer
            </h1>
            <p className="text-muted-foreground">
              Analyze email placement, headers, and deliverability metrics
            </p>
          </div>
        </div>
      </div>

      {/* Coming Soon Alert */}
      {!GMAIL_TOOL_ENABLED && (
        <Alert className="mb-8 border-amber-500/50 bg-amber-500/10">
          <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="text-amber-900 dark:text-amber-100">
            Coming Soon
          </AlertTitle>
          <AlertDescription className="mt-2 text-amber-800 dark:text-amber-200">
            <p className="mb-3">
              This tool is currently pending Google verification. The Gmail Deliverability Viewer 
              requires Google's approval before it can be made available to all users.
            </p>
            <div className="space-y-2 text-sm">
              <p className="font-medium">What this means:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>The tool is fully built and ready to use</li>
                <li>We're waiting for Google to complete the verification process</li>
                <li>Once verified, the tool will be available to everyone</li>
              </ul>
              <p className="mt-3 pt-3 border-t border-amber-500/20">
                <strong>Expected timeline:</strong> Verification typically takes 2-4 weeks. 
                We'll notify you as soon as the tool becomes available.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      {GMAIL_TOOL_ENABLED ? (
        <Tabs defaultValue="search" className="space-y-6">
          <TabsList>
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search Inbox
            </TabsTrigger>
            <TabsTrigger value="accounts" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Manage Accounts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <Search className="h-6 w-6 animate-pulse text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">Loading accounts...</p>
                </div>
              </div>
            ) : ownedAccounts.length === 0 && sharedAccounts.length === 0 ? (
              <div className="rounded-lg border border-dashed p-12 text-center">
                <Mail className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">
                  No Gmail accounts available
                </h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Connect a Gmail account in the "Manage Accounts" tab to start
                  searching.
                </p>
              </div>
            ) : (
              <GmailSearch
                accounts={ownedAccounts}
                sharedAccounts={sharedAccounts}
              />
            )}
          </TabsContent>

          <TabsContent value="accounts">
            <GmailAccountManager
              accounts={ownedAccounts}
              onRefresh={loadAccounts}
            />
          </TabsContent>
        </Tabs>
      ) : (
        <div className="rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/30 p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Shield className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-xl font-semibold">
            Tool Temporarily Unavailable
          </h3>
          <p className="mb-4 text-sm text-muted-foreground max-w-md mx-auto">
            This tool is pending Google verification. All functionality is disabled 
            until verification is complete. Please check back soon!
          </p>
        </div>
      )}

      {/* Info Card */}
      <div className="mt-8 rounded-lg border bg-muted/50 p-6">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <AlertCircle className="h-4 w-4" />
          Privacy & Security
        </h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
            <span>
              We only access Gmail metadata (subject, sender, labels, headers).
              Email bodies are never stored or accessed.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
            <span>
              OAuth tokens are encrypted and stored securely. Only you can
              manage your connected accounts.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
            <span>
              You can revoke access at any time from this page or your Google
              account settings.
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}

