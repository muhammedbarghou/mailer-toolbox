"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileText } from "lucide-react";
import TermsOfService from "@/components/Policies/terms";

const TermsSection = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Terms of Service
        </CardTitle>
        <CardDescription>
          Please read our terms of service carefully.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="max-h-[600px] overflow-y-auto rounded-lg border p-4">
          <div className="[&>div]:min-h-0 [&>div]:bg-transparent [&>div>div]:mx-0 [&>div>div]:max-w-none [&>div>div]:px-0 [&>div>div]:py-4">
            <TermsOfService />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TermsSection;


