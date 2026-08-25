"use client";

import DOMPurify from "dompurify";

/**
 * Sanitise untrusted HTML before it is rendered into the page.
 *
 * The email tools exist so people can paste HTML that arrived in their inbox,
 * which means the input is routinely written by someone other than the user.
 * Rendering it unsanitised on our own origin would run the author's script with
 * the visitor's session.
 *
 * The allowlist stays wide enough for real email markup: tables, inline styles,
 * images and <style> blocks all survive. Only script-bearing constructs are
 * removed. DOMPurify already strips on* handlers and javascript: URLs; the
 * explicit lists below cover the tags and attributes worth denying outright.
 */
export const sanitizeHtmlPreview = (html: string): string => {
  // DOMPurify needs a real DOM, and this only ever runs for a client preview
  if (typeof window === "undefined") {
    return "";
  }

  return DOMPurify.sanitize(html, {
    FORBID_TAGS: ["script", "iframe", "object", "embed", "form", "base", "link", "meta"],
    FORBID_ATTR: ["formaction", "srcdoc", "ping", "http-equiv"],
    ALLOW_DATA_ATTR: false,
  });
};
