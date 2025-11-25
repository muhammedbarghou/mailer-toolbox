"use client";

import { useEffect, useState } from "react";
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
  AlertCircle,
  Calendar,
  CheckCircle2,
  Edit2,
  Loader2,
  Lock,
  Mail,
  Shield,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const PersonalPrivacySection = () => {
  const { user, updateProfile, updatePassword } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [isEditingDisplayName, setIsEditingDisplayName] = useState(false);
  const [savingDisplayName, setSavingDisplayName] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  useEffect(() => {
    if (user?.user_metadata?.display_name) {
      setDisplayName(user.user_metadata.display_name);
    }
  }, [user]);

  const handleUpdateDisplayName = async () => {
    if (!displayName.trim()) {
      toast.error("Display name cannot be empty");
      return;
    }

    setSavingDisplayName(true);
    try {
      const { error } = await updateProfile(displayName);
      if (error) {
        toast.error(error.message || "Failed to update display name");
        return;
      }

      toast.success("Display name updated successfully");
      setIsEditingDisplayName(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update display name");
    } finally {
      setSavingDisplayName(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword.trim()) {
      toast.error("Please enter a new password");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await updatePassword(newPassword);
      if (error) {
        toast.error(error.message || "Failed to change password");
        return;
      }

      toast.success("Password changed successfully");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordForm(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Personal &amp; Privacy Settings
        </CardTitle>
        <CardDescription>
          Manage your personal information and account privacy settings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Display Name */}
        <div className="space-y-2">
          <Label htmlFor="display-name">Display Name</Label>
          <div className="flex items-center gap-2">
            <Input
              id="display-name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              disabled={!isEditingDisplayName || savingDisplayName}
              placeholder="Enter your display name"
            />
            {isEditingDisplayName ? (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleUpdateDisplayName}
                  disabled={savingDisplayName}
                >
                  {savingDisplayName ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Edit2 className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsEditingDisplayName(false);
                    setDisplayName(user?.user_metadata?.display_name || "");
                  }}
                  disabled={savingDisplayName}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditingDisplayName(true)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            This name will be displayed throughout the application.
          </p>
        </div>

        {/* Email (Read-only) */}
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <div className="flex items-center gap-2">
            <Input
              id="email"
              value={user?.email || ""}
              disabled
              className="bg-muted"
            />
            <Mail className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">
            Your email address cannot be changed here. Contact support if you
            need to change it.
          </p>
        </div>

        {/* Password Change */}
        <div className="space-y-4 border-t pt-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Password</Label>
              <p className="text-xs text-muted-foreground">
                Change your account password to keep your account secure.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPasswordForm(!showPasswordForm)}
            >
              {showPasswordForm ? (
                <>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Change Password
                </>
              )}
            </Button>
          </div>

          {showPasswordForm && (
            <div className="space-y-4 rounded-lg border bg-muted/50 p-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="Enter new password"
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirm new password"
                  minLength={6}
                />
              </div>
              <Button
                onClick={handleChangePassword}
                disabled={
                  changingPassword || !newPassword || !confirmPassword
                }
                className="w-full"
              >
                {changingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Changing Password...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Update Password
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Account Information */}
        <div className="space-y-3 border-t pt-4">
          <Label>Account Information</Label>
          <div className="grid gap-3 text-sm">
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                <span>User ID</span>
              </div>
              <span className="font-mono text-xs">{user?.id || "N/A"}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Account Created</span>
              </div>
              <span>
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString()
                  : "N/A"}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>Email Verified</span>
              </div>
              <span>
                {user?.email_confirmed_at ? (
                  <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4" />
                    Verified
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                    <AlertCircle className="h-4 w-4" />
                    Not Verified
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonalPrivacySection;


