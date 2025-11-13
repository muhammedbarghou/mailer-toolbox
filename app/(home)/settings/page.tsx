"use client";

import { useState, useEffect } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Key,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Edit2,
  Save,
  X,
  Sparkles,
  Shield,
  ExternalLink,
} from "lucide-react";
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

export default function SettingsPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingKey, setAddingKey] = useState(false);
  const [editingKeyId, setEditingKeyId] = useState<string | null>(null);
  const [validatingKeyId, setValidatingKeyId] = useState<string | null>(null);

  // Form state
  const [provider, setProvider] = useState<ApiKeyProvider>("gemini");
  const [keyName, setKeyName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [setAsDefault, setSetAsDefault] = useState(false);

  // Load API keys
  const loadApiKeys = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/api-keys");
      
      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = "Failed to load API keys";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If response is not JSON, use status text
          errorMessage = response.statusText || `Server error (${response.status})`;
        }
        
        // Handle unauthorized separately
        if (response.status === 401) {
          errorMessage = "Please sign in to view your API keys";
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setApiKeys(data.keys || []);
    } catch (error) {
      console.error("Error loading API keys:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to load API keys";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApiKeys();
  }, []);

  // Handle add new key
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
        throw new Error(data.error || "Failed to create API key");
      }

      toast.success("API key created and validated successfully");
      
      // Reset form
      setApiKey("");
      setKeyName("");
      setSetAsDefault(false);
      
      // Reload keys
      await loadApiKeys();
    } catch (error: any) {
      console.error("Error adding API key:", error);
      toast.error(error.message || "Failed to create API key");
    } finally {
      setAddingKey(false);
    }
  };

  // Handle delete key
  const handleDeleteKey = async (keyId: string) => {
    if (!confirm("Are you sure you want to delete this API key?")) {
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

  // Handle validate key
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

  // Handle set as default
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

  // Get status badge
  const getStatusBadge = (key: ApiKey) => {
    if (key.validation_status === "valid") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
          <CheckCircle2 className="h-3 w-3" />
          Valid
        </span>
      );
    }
    
    if (key.validation_status === "invalid") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
          <XCircle className="h-3 w-3" />
          Invalid
        </span>
      );
    }
    
    if (key.validation_status === "pending") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20">
          <AlertCircle className="h-3 w-3" />
          Pending
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-500/10 text-gray-600 dark:text-gray-400 border border-gray-500/20">
        <AlertCircle className="h-3 w-3" />
        Unknown
      </span>
    );
  };

  // Filter keys by provider
  const geminiKeys = apiKeys.filter((k) => k.provider === "gemini");
  const otherKeys = apiKeys.filter((k) => k.provider !== "gemini");

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6 md:py-12 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Key className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold">API Keys Settings</h1>
        </div>
        <p className="text-muted-foreground">
          Manage your AI provider API keys. Your keys are encrypted and stored securely.
        </p>
      </div>

      {/* Add New Key Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New API Key
          </CardTitle>
          <CardDescription>
            Add a new API key for your preferred AI provider. Keys are validated in real-time.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="provider">Provider</Label>
              <Select
                value={provider}
                onValueChange={(value) => setProvider(value as ApiKeyProvider)}
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
                  <SelectItem value="openai" disabled>
                    <div className="flex items-center gap-2">
                      <span>OpenAI</span>
                      <span className="text-xs text-muted-foreground">(Coming soon)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="anthropic" disabled>
                    <div className="flex items-center gap-2">
                      <span>Anthropic</span>
                      <span className="text-xs text-muted-foreground">(Coming soon)</span>
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
                onChange={(e) => setKeyName(e.target.value)}
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
              onChange={(e) => setApiKey(e.target.value)}
            />
            {provider === "gemini" && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
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
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="set-as-default"
              checked={setAsDefault}
              onChange={(e) => setSetAsDefault(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="set-as-default" className="text-sm font-normal cursor-pointer">
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
                Validating & Adding...
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
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <Key className="h-12 w-12 mx-auto text-muted-foreground/50" />
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
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Gemini Keys
                  </h3>
                  {geminiKeys.map((key) => (
                    <div
                      key={key.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{key.key_name}</span>
                          {key.is_default && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                              Default
                            </span>
                          )}
                          {getStatusBadge(key)}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Provider: {key.provider}</span>
                          <span>
                            Created: {new Date(key.created_at).toLocaleDateString()}
                          </span>
                          {key.last_validated_at && (
                            <span>
                              Validated: {new Date(key.last_validated_at).toLocaleDateString()}
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
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Other Providers
                  </h3>
                  {otherKeys.map((key) => (
                    <div
                      key={key.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{key.key_name}</span>
                          {key.is_default && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                              Default
                            </span>
                          )}
                          {getStatusBadge(key)}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Provider: {key.provider}</span>
                          <span>
                            Created: {new Date(key.created_at).toLocaleDateString()}
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

      {/* Security Info */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security & Privacy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            • Your API keys are encrypted using AES-256-GCM encryption before being stored in our database.
          </p>
          <p>
            • Keys are only decrypted server-side when needed for API calls.
          </p>
          <p>
            • You can delete your keys at any time, which will immediately stop their usage.
          </p>
          <p>
            • We never log or expose your API keys in error messages or logs.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

