import { google } from "googleapis";
import { extractSendingIp, extractSendingDomain } from "./headers";

export interface GmailMessage {
  id: string;
  subject: string;
  from: string;
  snippet: string;
  labels: string[];
  date: string;
  sendingIp?: string;
  sendingDomain?: string;
}

/**
 * Create authenticated Gmail API client
 */
export const createGmailClient = (accessToken: string) => {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  return google.gmail({ version: "v1", auth: oauth2Client });
};

/**
 * Search Gmail messages
 */
export const searchMessages = async (
  client: ReturnType<typeof createGmailClient>,
  query: string,
  label?: string,
  maxResults: number = 25,
  pageToken?: string
): Promise<{
  messages: Array<{ id: string; threadId: string }>;
  nextPageToken?: string;
}> => {
  try {
    // Build Gmail search query
    let gmailQuery = query || "";

    // Add label filter if specified
    if (label && label !== "ALL") {
      const labelMap: Record<string, string> = {
        PRIMARY: "in:inbox category:primary",
        PROMOTIONS: "in:inbox category:promotions",
        SPAM: "in:spam",
        SOCIAL: "in:inbox category:social",
      };

      const labelQuery = labelMap[label.toUpperCase()];
      if (labelQuery) {
        gmailQuery = gmailQuery
          ? `${gmailQuery} ${labelQuery}`
          : labelQuery;
      }
    }

    const response = await client.users.messages.list({
      userId: "me",
      q: gmailQuery,
      maxResults,
      pageToken,
    });

    return {
      messages: response.data.messages || [],
      nextPageToken: response.data.nextPageToken || undefined,
    };
  } catch (error) {
    console.error("Error searching messages:", error);
    throw error;
  }
};

/**
 * Get message metadata (headers only, no body)
 */
export const getMessageMetadata = async (
  client: ReturnType<typeof createGmailClient>,
  messageId: string
): Promise<GmailMessage | null> => {
  try {
    const response = await client.users.messages.get({
      userId: "me",
      id: messageId,
      format: "metadata",
      metadataHeaders: [
        "From",
        "Subject",
        "Received",
        "Return-Path",
        "DKIM-Signature",
        "Authentication-Results",
      ],
    });

    const message = response.data;
    if (!message) return null;

    // Extract headers
    const headers = message.payload?.headers || [];
    const headerMap: Record<string, string> = {};
    const receivedHeaders: string[] = [];

    for (const header of headers) {
      if (!header.name || !header.value) continue;

      const name = header.name.toLowerCase();
      headerMap[name] = header.value;

      if (name === "received") {
        receivedHeaders.push(header.value);
      }
    }

    // Extract fields
    const subject = headerMap["subject"] || "(No Subject)";
    const from = headerMap["from"] || "Unknown";
    const snippet = message.snippet || "";
    const labels = message.labelIds || [];
    const internalDate = message.internalDate
      ? parseInt(message.internalDate)
      : Date.now();
    const date = new Date(internalDate).toISOString();

    // Extract sending IP and domain
    const sendingIp = extractSendingIp(receivedHeaders);
    const sendingDomain = extractSendingDomain({
      "DKIM-Signature": headerMap["dkim-signature"],
      "Return-Path": headerMap["return-path"],
      From: headerMap["from"],
    });

    return {
      id: messageId,
      subject,
      from,
      snippet,
      labels,
      date,
      sendingIp: sendingIp || undefined,
      sendingDomain: sendingDomain || undefined,
    };
  } catch (error) {
    console.error("Error getting message metadata:", error);
    return null;
  }
};

/**
 * Search and get message metadata in batch
 * Implements rate limiting and error handling
 */
export const searchAndGetMessages = async (
  client: ReturnType<typeof createGmailClient>,
  query: string,
  label?: string,
  maxResults: number = 25,
  pageToken?: string
): Promise<{
  messages: GmailMessage[];
  nextPageToken?: string;
}> => {
  try {
    // Search for message IDs
    const searchResult = await searchMessages(
      client,
      query,
      label,
      maxResults,
      pageToken
    );

    // Get metadata for each message (with rate limiting)
    const messages: GmailMessage[] = [];
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    for (let i = 0; i < searchResult.messages.length; i++) {
      const messageId = searchResult.messages[i].id;
      const metadata = await getMessageMetadata(client, messageId);

      if (metadata) {
        messages.push(metadata);
      }

      // Rate limiting: delay every 10 requests
      if ((i + 1) % 10 === 0 && i < searchResult.messages.length - 1) {
        await delay(100); // 100ms delay
      }
    }

    return {
      messages,
      nextPageToken: searchResult.nextPageToken,
    };
  } catch (error) {
    console.error("Error searching and getting messages:", error);
    throw error;
  }
};

