"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Search, Mail } from "lucide-react";
import { GmailResults } from "./GmailResults";

interface GmailAccount {
  id: string;
  email: string;
}

interface GmailSearchProps {
  accounts: GmailAccount[];
  sharedAccounts: GmailAccount[];
}

export const GmailSearch = ({ accounts, sharedAccounts }: GmailSearchProps) => {
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [query, setQuery] = useState("");
  const [label, setLabel] = useState<string>("ALL");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);

  const allAccounts = [...accounts, ...sharedAccounts];

  const handleSearch = async (pageToken?: string) => {
    if (!selectedAccount) {
      setError("Please select an inbox");
      return;
    }

    setSearching(true);
    setError(null);

    try {
      const response = await fetch("/api/gmail/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountId: selectedAccount,
          query: query.trim() || undefined,
          label: label !== "ALL" ? label : undefined,
          maxResults: 25,
          pageToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to search messages");
      }

      if (pageToken) {
        // Append to existing results
        setResults((prev) => [...prev, ...(data.messages || [])]);
      } else {
        // Replace results
        setResults(data.messages || []);
      }

      setNextPageToken(data.nextPageToken);
    } catch (error: any) {
      console.error("Error searching Gmail:", error);
      setError(error.message || "Failed to search messages");
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleLoadMore = () => {
    if (nextPageToken) {
      handleSearch(nextPageToken);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Search Inbox
        </CardTitle>
        <CardDescription>
          Search Gmail messages by subject, sender, or filter by label to analyze
          deliverability.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Inbox Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Inbox</label>
          <Select value={selectedAccount} onValueChange={setSelectedAccount}>
            <SelectTrigger>
              <SelectValue placeholder="Choose an inbox to search" />
            </SelectTrigger>
            <SelectContent>
              {accounts.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    Your Accounts
                  </div>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {account.email}
                      </div>
                    </SelectItem>
                  ))}
                </>
              )}
              {sharedAccounts.length > 0 && (
                <>
                  {accounts.length > 0 && (
                    <div className="my-1 border-t" />
                  )}
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    Shared With You
                  </div>
                  {sharedAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {account.email}
                      </div>
                    </SelectItem>
                  ))}
                </>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Search Query */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Search Query</label>
          <Input
            type="text"
            placeholder='e.g., "subject:Welcome" or "from:example.com"'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
          />
          <p className="text-xs text-muted-foreground">
            Use Gmail search syntax: <code>subject:</code>, <code>from:</code>,
            or plain text
          </p>
        </div>

        {/* Label Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Filter by Label</label>
          <Select value={label} onValueChange={setLabel}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Labels</SelectItem>
              <SelectItem value="PRIMARY">Primary</SelectItem>
              <SelectItem value="PROMOTIONS">Promotions</SelectItem>
              <SelectItem value="SOCIAL">Social</SelectItem>
              <SelectItem value="SPAM">Spam</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Search Button */}
        <Button
          onClick={() => handleSearch()}
          disabled={!selectedAccount || searching}
          className="w-full"
        >
          {searching ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Search
            </>
          )}
        </Button>

        {/* Error Message */}
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <GmailResults
            messages={results}
            onLoadMore={nextPageToken ? handleLoadMore : undefined}
            hasMore={!!nextPageToken}
            loadingMore={searching && results.length > 0}
          />
        )}

        {/* Empty State */}
        {!searching && results.length === 0 && selectedAccount && !error && (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <Search className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No results yet. Enter a search query and click Search.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

