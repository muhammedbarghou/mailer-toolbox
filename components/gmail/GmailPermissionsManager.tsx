"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  UserPlus,
  X,
  Users,
  Mail,
} from "lucide-react";
import { toast } from "sonner";

interface Viewer {
  id: string;
  email: string;
  name: string;
}

interface GmailPermissionsManagerProps {
  accountId: string;
  onUpdate: () => void;
}

export const GmailPermissionsManager = ({
  accountId,
  onUpdate,
}: GmailPermissionsManagerProps) => {
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState("");

  useEffect(() => {
    loadViewers();
  }, [accountId]);

  const loadViewers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/gmail/permissions?accountId=${accountId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load viewers");
      }

      setViewers(data.viewers || []);
    } catch (error: any) {
      console.error("Error loading viewers:", error);
      toast.error(error.message || "Failed to load viewers");
    } finally {
      setLoading(false);
    }
  };

  const handleAddViewer = async () => {
    if (!emailInput.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    setAdding(true);

    try {
      const response = await fetch("/api/gmail/permissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountId,
          viewerEmail: emailInput.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add viewer");
      }

      toast.success(`Viewer added: ${data.viewer?.name || data.viewer?.email || "Success"}`);
      setEmailInput("");
      loadViewers();
      onUpdate();
    } catch (error: any) {
      console.error("Error adding viewer:", error);
      toast.error(error.message || "Failed to add viewer");
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveViewer = async (viewerId: string) => {
    if (!confirm("Are you sure you want to remove this viewer?")) {
      return;
    }

    setRemoving(viewerId);

    try {
      const response = await fetch("/api/gmail/permissions", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountId,
          viewerId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to remove viewer");
      }

      toast.success("Viewer removed successfully");
      loadViewers();
      onUpdate();
    } catch (error: any) {
      console.error("Error removing viewer:", error);
      toast.error(error.message || "Failed to remove viewer");
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="mb-2 text-sm font-semibold">Shared Access</h4>
        <p className="text-sm text-muted-foreground">
          Grant colleagues access to view this inbox's metadata for
          deliverability analysis.
        </p>
      </div>

      {/* Add Viewer */}
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="Enter email address"
          value={emailInput}
          onChange={(e) => setEmailInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleAddViewer();
            }
          }}
          className="flex-1"
        />
        <Button
          onClick={handleAddViewer}
          disabled={adding || !emailInput.trim()}
          size="sm"
        >
          {adding ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <UserPlus className="mr-2 h-4 w-4" />
              Add
            </>
          )}
        </Button>
      </div>

      {/* Viewers List */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : viewers.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <Users className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No viewers added yet. Share access by entering an email above.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {viewers.map((viewer) => (
            <div
              key={viewer.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{viewer.name}</p>
                  <p className="text-xs text-muted-foreground">{viewer.email}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveViewer(viewer.id)}
                disabled={removing === viewer.id}
                className="text-destructive hover:text-destructive"
              >
                {removing === viewer.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

