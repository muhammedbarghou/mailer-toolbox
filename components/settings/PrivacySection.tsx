"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Shield } from "lucide-react";
import PrivacyPolicy from "@/components/Policies/privacy";

const PrivacySection = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Privacy Policy
        </CardTitle>
        <CardDescription>
          Learn how we protect and handle your data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="max-h-[600px] overflow-y-auto rounded-lg border p-4">
          <div className="[&>div]:min-h-0 [&>div]:bg-transparent [&>div>div]:mx-0 [&>div>div]:max-w-none [&>div>div]:px-0 [&>div>div]:py-4">
            <PrivacyPolicy />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PrivacySection;


