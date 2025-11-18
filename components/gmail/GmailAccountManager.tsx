"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Loader2,
  Mail,
  Trash2,
  Users,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { GmailPermissionsManager } from "./GmailPermissionsManager";

interface GmailAccount {
  id: string;
  email: string;
  created_at: string;
}

interface GmailAccountManagerProps {
  accounts: GmailAccount[];
  onRefresh: () => void;
}

export const GmailAccountManager = ({
  accounts,
  onRefresh,
}: GmailAccountManagerProps) => {
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

  const handleConnect = async () => {
    try {
      const response = await fetch("/api/gmail/auth-url");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get authorization URL");
      }

      // Redirect to Google OAuth
      window.location.href = data.authUrl;
    } catch (error: any) {
      console.error("Error connecting Gmail:", error);
      toast.error(error.message || "Failed to connect Gmail account");
    }
  };

  const handleDisconnect = async (accountId: string) => {
    if (!confirm("Are you sure you want to disconnect this Gmail account?")) {
      return;
    }

    setDisconnecting(accountId);

    try {
      const response = await fetch("/api/gmail/disconnect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accountId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to disconnect account");
      }

      toast.success("Gmail account disconnected successfully");
      onRefresh();
    } catch (error: any) {
      console.error("Error disconnecting Gmail:", error);
      toast.error(error.message || "Failed to disconnect account");
    } finally {
      setDisconnecting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Connect Button */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Gmail Accounts
          </CardTitle>
          <CardDescription>
            Connect your Gmail account to analyze email deliverability and
            placement.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleConnect} className="w-full sm:w-auto">
            <Mail className="mr-2 h-4 w-4" />
            Connect Gmail Account
          </Button>
        </CardContent>
      </Card>

      {/* Connected Accounts */}
      {accounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Connected Accounts</CardTitle>
            <CardDescription>
              Manage your connected Gmail accounts and share access with
              colleagues.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{account.email}</p>
                    <p className="text-sm text-muted-foreground">
                      Connected{" "}
                      {new Date(account.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setSelectedAccount(
                        selectedAccount === account.id ? null : account.id
                      )
                    }
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Manage Access
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDisconnect(account.id)}
                    disabled={disconnecting === account.id}
                    className="text-destructive hover:text-destructive"
                  >
                    {disconnecting === account.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}

            {/* Permissions Manager */}
            {selectedAccount && (
              <div className="mt-4 rounded-lg border bg-muted/50 p-4">
                <GmailPermissionsManager
                  accountId={selectedAccount}
                  onUpdate={onRefresh}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {accounts.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Mail className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">No Gmail accounts connected</h3>
            <p className="mb-4 text-center text-sm text-muted-foreground">
              Connect your Gmail account to start analyzing email deliverability
              and placement.
            </p>
            <Button onClick={handleConnect}>
              <Mail className="mr-2 h-4 w-4" />
              Connect Your First Account
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

