"use client";

import { useState, useRef, useCallback, type DragEvent } from "react";
import { AlertCircle, CheckCircle2, Download, FileText, Loader2, ShieldCheck, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type JSZipArchive = {
  file: (name: string, data: string) => void;
  generateAsync: (options: { type: "blob"; compression: "DEFLATE" }) => Promise<Blob>;
};

type JSZipConstructor = new () => JSZipArchive;

declare global {
  interface Window {
    JSZip?: JSZipConstructor;
  }
}

// Load JSZip from CDN dynamically
function loadJSZip() {
  return new Promise<JSZipConstructor>((resolve, reject) => {
    if (window.JSZip) return resolve(window.JSZip);
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
    script.onload = () => {
      if (!window.JSZip) {
        reject(new Error("JSZip failed to load."));
        return;
      }
      resolve(window.JSZip);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function parseMbox(text: string) {
  const emails: string[] = [];
  // mbox format: each email starts with "From " (with a space) at the beginning of a line
  const lines = text.split("\n");
  let current = [];
  let inEmail = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("From ") && (i === 0 || lines[i - 1] === "" || lines[i - 1] === "\r")) {
      if (inEmail && current.length > 0) {
        emails.push(current.join("\n").trim());
        current = [];
      }
      inEmail = true;
      // Skip the mbox "From " envelope line — not part of the email itself
      // (optional: keep it as X-mbox-from header)
    } else if (inEmail) {
      // Un-escape mbox ">From " quoting
      current.push(line.startsWith(">From ") ? line.slice(1) : line);
    }
  }
  if (inEmail && current.length > 0) {
    emails.push(current.join("\n").trim());
  }
  return emails;
}

function getHeader(emailText: string, headerName: string) {
  const regex = new RegExp(`^${headerName}:\\s*(.+)`, "im");
  const match = emailText.match(regex);
  return match ? match[1].trim() : "";
}

function sanitize(str: string, maxLen = 50) {
  return str
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_{2,}/g, "_")
    .slice(0, maxLen)
    .trim() || "untitled";
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MboxConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "parsing" | "converting" | "done" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [totalEmails, setTotalEmails] = useState(0);
  const [processedEmails, setProcessedEmails] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [zipBlob, setZipBlob] = useState<Blob | null>(null);
  const [zipSize, setZipSize] = useState(0);
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFile = (f: File | null) => {
    if (!f) return;
    if (!f.name.endsWith(".mbox")) {
      setErrorMsg("Please select a valid .mbox file.");
      setStatus("error");
      return;
    }
    setFile(f);
    setStatus("idle");
    setZipBlob(null);
    setErrorMsg("");
    setProgress(0);
    setTotalEmails(0);
    setProcessedEmails(0);
  };

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
    const f = e.dataTransfer.files[0];
    handleFile(f);
  }, []);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = () => {
    setIsDragActive(false);
  };

  const convert = async () => {
    if (!file) return;
    setStatus("parsing");
    setProgress(0);
    setZipBlob(null);
    setErrorMsg("");

    try {
      const JSZip = await loadJSZip();
      const text = await file.text();

      setStatus("converting");
      const emails = parseMbox(text);
      setTotalEmails(emails.length);

      if (emails.length === 0) {
        throw new Error("No emails found in this .mbox file.");
      }

      const zip = new JSZip();
      const seen: Record<string, number> = {};

      // Process in chunks to avoid blocking UI
      const CHUNK = 100;
      for (let i = 0; i < emails.length; i += CHUNK) {
        const chunk = emails.slice(i, i + CHUNK);
        chunk.forEach((emailText, j) => {
          const idx = i + j;
          const subject = getHeader(emailText, "Subject") || "no_subject";
          const rawDate = getHeader(emailText, "Date");
          const dateStr = rawDate
            ? rawDate.replace(/[^0-9\-]/g, "").slice(0, 10)
            : "";
          const base = `${String(idx + 1).padStart(5, "0")}_${dateStr}_${sanitize(subject)}`;
          const count = seen[base] || 0;
          seen[base] = count + 1;
          const filename = count ? `${base}_${count}.eml` : `${base}.eml`;
          zip.file(filename, emailText);
        });

        setProcessedEmails(Math.min(i + CHUNK, emails.length));
        setProgress(Math.round((Math.min(i + CHUNK, emails.length) / emails.length) * 100));
        // Yield to the browser
        await new Promise((r) => setTimeout(r, 0));
      }

      const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
      setZipBlob(blob);
      setZipSize(blob.size);
      setStatus("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Conversion failed.");
      setStatus("error");
    }
  };

  const download = () => {
    if (!zipBlob || !file) return;
    const baseName = file.name.replace(/\.mbox$/i, "");
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${baseName}_emails.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setFile(null);
    setStatus("idle");
    setZipBlob(null);
    setErrorMsg("");
    setProgress(0);
    setTotalEmails(0);
    setProcessedEmails(0);
    if (inputRef.current) inputRef.current.value = "";
  };

  const isProcessing = status === "parsing" || status === "converting";

  return (
    <div className="min-h-screen bg-background p-4 text-foreground md:p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Mbox to EML Converter</h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Convert your Google Takeout <code>.mbox</code> file into individual <code>.eml</code> files bundled in a ZIP.
            Everything runs locally in your browser.
          </p>
        </div>

        {!file && (
          <div
            role="button"
            tabIndex={0}
            aria-label="Upload mbox file"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                inputRef.current?.click();
              }
            }}
            onClick={() => inputRef.current?.click()}
            data-dragging={isDragActive || undefined}
            className="relative flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-input bg-card px-4 py-8 text-center transition-colors hover:bg-accent/40 data-[dragging=true]:border-primary data-[dragging=true]:bg-accent/50"
          >
            <input
              ref={inputRef}
              type="file"
              accept=".mbox"
              className="sr-only"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
            <div className="mb-3 flex size-12 items-center justify-center rounded-full border border-border bg-background">
              <Upload className="size-5 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold">Drop your .mbox file here</h3>
            <p className="mt-1 text-sm text-muted-foreground">or click to browse</p>
          </div>
        )}

        {file && (
          <Card className="border-emerald-500/30 bg-emerald-500/5 p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-emerald-500/30 bg-emerald-500/10">
                <FileText className="size-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
              </div>
              {!isProcessing && (
                <Button type="button" variant="ghost" size="icon" className="size-8" onClick={reset} aria-label="Remove file">
                  <X className="size-4" />
                </Button>
              )}
            </div>
          </Card>
        )}

        {file && status !== "done" && (
          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={convert} disabled={isProcessing} className="min-w-40 flex-1">
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  {status === "parsing" ? "Reading file..." : `Converting... ${progress}%`}
                </>
              ) : (
                "Convert to EML"
              )}
            </Button>
            {!isProcessing && (
              <Button type="button" variant="outline" onClick={reset}>
                Reset
              </Button>
            )}
          </div>
        )}

        {isProcessing && (
          <Card className="space-y-3 p-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{status === "parsing" ? "Reading mbox..." : "Packing emails..."}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
            {totalEmails > 0 && (
              <p className="text-xs text-muted-foreground">
                {processedEmails.toLocaleString()} / {totalEmails.toLocaleString()} emails
              </p>
            )}
          </Card>
        )}

        {status === "done" && (
          <>
            <Card className="border-primary/30 bg-primary/5 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-md border border-primary/30 bg-primary/10">
                  <CheckCircle2 className="size-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{totalEmails.toLocaleString()} emails converted</p>
                  <p className="text-xs text-muted-foreground">ZIP size: {formatBytes(zipSize)}</p>
                </div>
                <Button type="button" onClick={download}>
                  <Download className="mr-2 size-4" />
                  Download ZIP
                </Button>
              </div>
            </Card>
            <Button type="button" variant="outline" className="w-full" onClick={reset}>
              Convert another file
            </Button>
          </>
        )}

        {status === "error" && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" />
          <p>100% private: all processing happens locally in your browser. Your emails are never uploaded.</p>
        </div>
      </div>
    </div>
  );
}
