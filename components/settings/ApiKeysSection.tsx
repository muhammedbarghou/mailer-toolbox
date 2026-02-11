"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Key,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { ApiKeysSkeleton } from "@/components/skeletons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { ApiKeyProvider } from "@/lib/api-keys";

interface ApiKey {
  id: string;
  provider: ApiKeyProvider;
  key_name: string | null;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  last_validated_at: string | null;
  validation_status: "pending" | "valid" | "invalid" | "expired";
  validation_error: string | null;
}

const ApiKeysSection = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingKey, setAddingKey] = useState(false);
  const [validatingKeyId, setValidatingKeyId] = useState<string | null>(null);

  const [provider, setProvider] = useState<ApiKeyProvider>("gemini");
  const [keyName, setKeyName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [setAsDefault, setSetAsDefault] = useState(false);

  const loadApiKeys = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/api-keys");

      if (!response.ok) {
        let errorMessage = "Failed to load API keys";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = response.statusText || `Server error (${response.status})`;
        }

        if (response.status === 401) {
          errorMessage = "Please sign in to view your API keys";
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      setApiKeys(data.keys || []);
    } catch (error) {
      console.error("Error loading API keys:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load API keys";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApiKeys();
  }, []);

  const handleAddKey = async () => {
    if (!apiKey.trim()) {
      toast.error("Please enter an API key");
      return;
    }

    if (!keyName.trim()) {
      toast.error("Please enter a key name");
      return;
    }

    setAddingKey(true);

    try {
      const response = await fetch("/api/api-keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider,
          api_key: apiKey.trim(),
          key_name: keyName.trim(),
          set_as_default: setAsDefault,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMessage = data?.validation_error || data?.error || "Failed to create API key";

        if (response.status === 401) {
          errorMessage =
            "Authentication required. Please sign in to add or update your API keys.";
        }

        throw new Error(errorMessage);
      }

      toast.success("API key created and validated successfully");

      setApiKey("");
      setKeyName("");
      setSetAsDefault(false);

      await loadApiKeys();
    } catch (error: any) {
      console.error("Error adding API key:", error);
      toast.error(error.message || "Failed to create API key");
    } finally {
      setAddingKey(false);
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    const shouldDelete = window.confirm(
      "Are you sure you want to delete this API key?",
    );
    if (!shouldDelete) {
      return;
    }

    try {
      const response = await fetch(`/api/api-keys/${keyId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete API key");
      }

      toast.success("API key deleted successfully");
      await loadApiKeys();
    } catch (error: any) {
      console.error("Error deleting API key:", error);
      toast.error(error.message || "Failed to delete API key");
    }
  };

  const handleValidateKey = async (keyId: string) => {
    setValidatingKeyId(keyId);

    try {
      const response = await fetch(`/api/api-keys/${keyId}/validate`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Validation failed");
      }

      toast.success("API key is valid");
      await loadApiKeys();
    } catch (error: any) {
      console.error("Error validating API key:", error);
      toast.error(error.message || "API key validation failed");
      await loadApiKeys();
    } finally {
      setValidatingKeyId(null);
    }
  };

  const handleSetDefault = async (keyId: string) => {
    try {
      const response = await fetch(`/api/api-keys/${keyId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          is_default: true,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to set default key");
      }

      toast.success("Default API key updated");
      await loadApiKeys();
    } catch (error: any) {
      console.error("Error setting default key:", error);
      toast.error(error.message || "Failed to set default key");
    }
  };

  const getStatusBadge = (key: ApiKey) => {
    if (key.validation_status === "valid") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-green-500/20 bg-green-500/10 px-2 py-1 text-xs font-medium text-green-600 dark:text-green-400">
          <CheckCircle2 className="h-3 w-3" />
          Valid
        </span>
      );
    }

    if (key.validation_status === "invalid") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-red-500/20 bg-red-500/10 px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400">
          <AlertCircle className="h-3 w-3" />
          Invalid
        </span>
      );
    }

    if (key.validation_status === "pending") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-2 py-1 text-xs font-medium text-yellow-600 dark:text-yellow-400">
          <AlertCircle className="h-3 w-3" />
          Pending
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-gray-500/20 bg-gray-500/10 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400">
        <AlertCircle className="h-3 w-3" />
        Unknown
      </span>
    );
  };

  const geminiKeys = apiKeys.filter((key) => key.provider === "gemini");
  const otherKeys = apiKeys.filter((key) => key.provider !== "gemini");

  return (
    <>
      {/* Add New Key Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New API Key
          </CardTitle>
          <CardDescription>
            Add a new API key for your preferred AI provider. Keys are
            validated in real-time.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="provider">Provider</Label>
              <Select
                value={provider}
                onValueChange={(value) =>
                  setProvider(value as ApiKeyProvider)
                }
              >
                <SelectTrigger id="provider">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      <span>Google Gemini</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="openai">
                    <div className="flex items-center gap-2">
                      <span>OpenAI</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="anthropic">
                    <div className="flex items-center gap-2">
                      <span>Anthropic</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="key-name">Key Name</Label>
              <Input
                id="key-name"
                placeholder="e.g., My Gemini Key"
                value={keyName}
                onChange={(event) => setKeyName(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="api-key">API Key</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="Enter your API key"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
            />
            {provider === "gemini" && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <ExternalLink className="h-3 w-3" />
                Get your Gemini API key from{" "}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Google AI Studio
                </a>
              </p>
            )}
            {provider === "openai" && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <ExternalLink className="h-3 w-3" />
                Get your OpenAI API key from{" "}
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  OpenAI Platform
                </a>
              </p>
            )}
            {provider === "anthropic" && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <ExternalLink className="h-3 w-3" />
                Get your Anthropic API key from{" "}
                <a
                  href="https://console.anthropic.com/settings/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Anthropic Console
                </a>
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="set-as-default"
              checked={setAsDefault}
              onChange={(event) => setSetAsDefault(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label
              htmlFor="set-as-default"
              className="cursor-pointer text-sm font-normal"
            >
              Set as default key for this provider
            </Label>
          </div>

          <Button
            onClick={handleAddKey}
            disabled={addingKey || !apiKey.trim() || !keyName.trim()}
            className="w-full"
          >
            {addingKey ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Validating &amp; Adding...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add API Key
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Existing Keys */}
      <Card>
        <CardHeader>
          <CardTitle>Your API Keys</CardTitle>
          <CardDescription>
            Manage your existing API keys. Default keys are used automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <ApiKeysSkeleton />
          ) : apiKeys.length === 0 ? (
            <div className="space-y-2 py-12 text-center">
              <Key className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">No API keys added yet</p>
              <p className="text-sm text-muted-foreground">
                Add your first API key above to get started
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Gemini Keys */}
              {geminiKeys.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Gemini Keys
                  </h3>
                  {geminiKeys.map((key) => (
                    <div
                      key={key.id}
                      className="flex items-center justify-between rounded-lg border bg-card p-4"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{key.key_name}</span>
                          {key.is_default && (
                            <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                              Default
                            </span>
                          )}
                          {getStatusBadge(key)}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Provider: {key.provider}</span>
                          <span>
                            Created:{" "}
                            {new Date(
                              key.created_at,
                            ).toLocaleDateString()}
                          </span>
                          {key.last_validated_at && (
                            <span>
                              Validated:{" "}
                              {new Date(
                                key.last_validated_at,
                              ).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        {key.validation_error && (
                          <p className="text-xs text-red-600 dark:text-red-400">
                            {key.validation_error}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {!key.is_default && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetDefault(key.id)}
                          >
                            Set Default
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleValidateKey(key.id)}
                          disabled={validatingKeyId === key.id}
                        >
                          {validatingKeyId === key.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Validate"
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteKey(key.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Other Provider Keys */}
              {otherKeys.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Other Providers
                  </h3>
                  {otherKeys.map((key) => (
                    <div
                      key={key.id}
                      className="flex items-center justify-between rounded-lg border bg-card p-4"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{key.key_name}</span>
                          {key.is_default && (
                            <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                              Default
                            </span>
                          )}
                          {getStatusBadge(key)}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Provider: {key.provider}</span>
                          <span>
                            Created:{" "}
                            {new Date(
                              key.created_at,
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteKey(key.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default ApiKeysSection;


