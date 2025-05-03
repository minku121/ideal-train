"use client";

import { useState, ReactNode } from "react";
import { useSession } from "next-auth/react";
import { User, Settings, Bell, Shield, CreditCard, Moon, Sun, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader } from "@/components/ui/loader";

interface SettingsLayoutProps {
  children: ReactNode;
}

export function SettingsLayout({ children }: SettingsLayoutProps) {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState("account");

  if (status === "loading") {
    return <Loader size="lg" text="Loading settings..." />;
  }

  if (!session?.user) {
    return null;
  }

  const role = session.user.role;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>
      
      <Tabs defaultValue="account" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
          <TabsTrigger value="account" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden md:inline">Account</span>
          </TabsTrigger>
          
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Moon className="h-4 w-4" />
            <span className="hidden md:inline">Appearance</span>
          </TabsTrigger>
          
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden md:inline">Notifications</span>
          </TabsTrigger>
          
          {/* Buyer specific tabs */}
          {role === "BUYER" && (
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden md:inline">Payment Methods</span>
            </TabsTrigger>
          )}
          
          {/* Seller specific tabs */}
          {role === "SELLER" && (
            <TabsTrigger value="sellerPreferences" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden md:inline">Seller Preferences</span>
            </TabsTrigger>
          )}
          
          {/* Mediator specific tabs */}
          {role === "MEDIATOR" && (
            <TabsTrigger value="disputeSettings" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden md:inline">Dispute Settings</span>
            </TabsTrigger>
          )}
          
          {/* Admin specific tabs */}
          {role === "ADMIN" && (
            <TabsTrigger value="adminSettings" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden md:inline">Admin Settings</span>
            </TabsTrigger>
          )}
        </TabsList>
        
        {children}
      </Tabs>
    </div>
  );
} 