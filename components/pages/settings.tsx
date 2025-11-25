"use client";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Key } from "lucide-react";
import PersonalPrivacySection from "@/components/settings/PersonalPrivacySection";
import ApiKeysSection from "@/components/settings/ApiKeysSection";
import SecurityInfoSection from "@/components/settings/SecurityInfoSection";
import TermsSection from "@/components/settings/TermsSection";
import PrivacySection from "@/components/settings/PrivacySection";

const Settings = () => {
  return (
    <div className="container mx-auto max-w-5xl space-y-8 px-4 py-6 md:py-12">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Key className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold md:text-4xl">Settings</h1>
        </div>
        <p className="text-muted-foreground">
          Manage your account settings, personal information, and API keys.
        </p>
      </div>

      {/* Personal & Privacy Settings */}
      <PersonalPrivacySection />

      {/* API Keys */}
      <Card className="border-amber-300/60 bg-amber-50/60 text-amber-950 dark:border-amber-400/40 dark:bg-amber-950/20 dark:text-amber-50">
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription className="space-y-1 text-amber-900 dark:text-amber-100">
            <p>
              We recently had an internal issue with API key storage and cleared
              existing keys to keep your data safe.
            </p>
            <p>
              Please add your API key again below to continue using AI-powered
              features such as the Email Rewriter and Subject Line Rewriter.
            </p>
          </CardDescription>
        </CardHeader>
      </Card>
      <ApiKeysSection />

      {/* Security Info */}
      <SecurityInfoSection />

      {/* Terms of Service */}
      <TermsSection />

      {/* Privacy Policy */}
      <PrivacySection />
    </div>
  );
};

export default Settings;