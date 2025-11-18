"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Mail,
  Calendar,
  Globe,
  Network,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface GmailMessage {
  id: string;
  subject: string;
  from: string;
  snippet: string;
  labels: string[];
  date: string;
  sendingIp?: string;
  sendingDomain?: string;
}

interface GmailResultsProps {
  messages: GmailMessage[];
  onLoadMore?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
}

const getLabelColor = (label: string) => {
  const labelUpper = label.toUpperCase();
  if (labelUpper === "PRIMARY") {
    return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
  }
  if (labelUpper === "PROMOTIONS") {
    return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
  }
  if (labelUpper === "SOCIAL") {
    return "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20";
  }
  if (labelUpper === "SPAM") {
    return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";
  }
  return "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20";
};

const getLabelName = (label: string) => {
  const labelUpper = label.toUpperCase();
  if (labelUpper === "INBOX") return "Primary";
  return label;
};

export const GmailResults = ({
  messages,
  onLoadMore,
  hasMore,
  loadingMore,
}: GmailResultsProps) => {
  const [expandedMessage, setExpandedMessage] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return dateString;
    }
  };

  const extractEmail = (from: string) => {
    const match = from.match(/<([^>]+)>/) || from.match(/(\S+@\S+)/);
    return match ? match[1] : from;
  };

  const extractName = (from: string) => {
    const match = from.match(/^(.+?)\s*<[^>]+>$/);
    return match ? match[1].trim() : null;
  };

  if (messages.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Results ({messages.length})
        </h3>
      </div>

      <div className="space-y-3">
        {messages.map((message) => {
          const email = extractEmail(message.from);
          const name = extractName(message.from);
          const primaryLabel =
            message.labels.find(
              (l) =>
                l.toUpperCase() === "PRIMARY" ||
                l.toUpperCase() === "PROMOTIONS" ||
                l.toUpperCase() === "SOCIAL" ||
                l.toUpperCase() === "SPAM"
            ) || message.labels[0] || "INBOX";

          return (
            <Card
              key={message.id}
              className="transition-shadow hover:shadow-md"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <Mail className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base">
                          {message.subject || "(No Subject)"}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {name ? (
                            <>
                              <span className="font-medium">{name}</span>{" "}
                              <span className="text-muted-foreground">
                                &lt;{email}&gt;
                              </span>
                            </>
                          ) : (
                            email
                          )}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                  <Badge
                    className={`${getLabelColor(primaryLabel)} border`}
                  >
                    {getLabelName(primaryLabel)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Snippet */}
                {message.snippet && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {message.snippet}
                  </p>
                )}

                {/* Metadata */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(message.date)}
                  </div>
                  {message.sendingIp && (
                    <div className="flex items-center gap-1">
                      <Network className="h-3 w-3" />
                      IP: {message.sendingIp}
                    </div>
                  )}
                  {message.sendingDomain && (
                    <div className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      Domain: {message.sendingDomain}
                    </div>
                  )}
                </div>

                {/* Expand Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setExpandedMessage(
                      expandedMessage === message.id ? null : message.id
                    )
                  }
                  className="w-full"
                >
                  {expandedMessage === message.id ? (
                    <>
                      <ChevronUp className="mr-2 h-4 w-4" />
                      Hide Details
                    </>
                  ) : (
                    <>
                      <ChevronDown className="mr-2 h-4 w-4" />
                      View Details
                    </>
                  )}
                </Button>

                {/* Expanded Details */}
                {expandedMessage === message.id && (
                  <div className="space-y-3 rounded-lg border bg-muted/50 p-4">
                    <div>
                      <h4 className="mb-2 text-sm font-semibold">
                        Deliverability Information
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Sending IP:
                          </span>
                          <span className="font-mono">
                            {message.sendingIp || "Not available"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Sending Domain:
                          </span>
                          <span className="font-mono">
                            {message.sendingDomain || "Not available"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Labels:</span>
                          <div className="flex flex-wrap gap-1">
                            {message.labels.map((label) => (
                              <Badge
                                key={label}
                                variant="outline"
                                className="text-xs"
                              >
                                {label}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    {message.snippet && (
                      <div>
                        <h4 className="mb-2 text-sm font-semibold">Preview</h4>
                        <p className="text-sm text-muted-foreground">
                          {message.snippet}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Load More */}
      {hasMore && onLoadMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More"
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

