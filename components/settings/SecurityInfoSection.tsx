"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Shield } from "lucide-react";

const SecurityInfoSection = () => {
  return (
    <Card className="bg-muted/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Security &amp; Privacy
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <p>
          • Your API keys are encrypted using AES-256-GCM encryption before
          being stored in our database.
        </p>
        <p>• Keys are only decrypted server-side when needed for API calls.</p>
        <p>
          • You can delete your keys at any time, which will immediately stop
          their usage.
        </p>
        <p>
          • We never log or expose your API keys in error messages or logs.
        </p>
      </CardContent>
    </Card>
  );
};

export default SecurityInfoSection;


