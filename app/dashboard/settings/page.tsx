"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Check, Globe, Save, Shield, Tag, Users, Database } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader } from "@/components/ui/loader";
import { SettingsLayout } from "@/components/SettingsLayout";
import { useSettings } from "@/hooks/useSettings";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { settings, loading, error, updateSettings, resetSettings } = useSettings();
  const [saving, setSaving] = useState(false);
  const [upiId, setUpiId] = useState("");
  
  useEffect(() => {
    if (status === "loading") return;
    
    if (!session?.user) {
      router.replace("/login");
    }
  }, [router, session, status]);
  
  useEffect(() => {
    if (settings && 'upiId' in settings) {
      const storedUpiId = settings.upiId;
      if (typeof storedUpiId === 'string') {
        setUpiId(storedUpiId);
      } else {
        setUpiId("");
      }
    }
  }, [settings]);

  const handleSaveSettings = async (newSettings: Record<string, any>) => {
    setSaving(true);
    await updateSettings(newSettings);
    setSaving(false);
  };

  if (status === "loading" || loading) {
    return <Loader fullScreen text="Loading settings..." />;
  }

  if (!session?.user) {
    return null;
  }

  const role = session.user.role;

  return (
    <SettingsLayout>
      {/* Account Settings */}
      <TabsContent value="account" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Update your account settings and personal information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" defaultValue={session.user.name || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" defaultValue={session.user.email || ""} disabled />
              <p className="text-xs text-muted-foreground">Email can only be changed by an administrator.</p>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-sm font-medium">
                  {session.user.role}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">Your role determines what actions you can perform in the system.</p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <Label htmlFor="showProfile">Profile Visibility</Label>
                <span className="text-xs text-muted-foreground">Allow others to see your profile</span>
              </div>
              <Switch
                id="showProfile"
                checked={settings.showProfile}
                onCheckedChange={(checked) => handleSaveSettings({ showProfile: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <Label htmlFor="showEmail">Email Visibility</Label>
                <span className="text-xs text-muted-foreground">Show your email to other users</span>
              </div>
              <Switch
                id="showEmail"
                checked={settings.showEmail}
                onCheckedChange={(checked) => handleSaveSettings({ showEmail: checked })}
              />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      {/* Appearance Settings */}
      <TabsContent value="appearance" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Customize the look and feel of your dashboard.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <Label htmlFor="darkMode">Dark Mode</Label>
                <span className="text-xs text-muted-foreground">Enable dark theme for the application</span>
              </div>
              <Switch
                id="darkMode"
                checked={settings.darkMode}
                onCheckedChange={(checked) => handleSaveSettings({ darkMode: checked })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select 
                value={settings.language}
                onValueChange={(value) => handleSaveSettings({ language: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <span>English</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="es">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <span>Español</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="fr">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <span>Français</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Theme Color</Label>
              <div className="flex gap-4">
                <Input
                  type="color"
                  id="primaryColor"
                  value={settings.primaryColor}
                  onChange={(e) => handleSaveSettings({ primaryColor: e.target.value })}
                  className="h-10 w-10 p-1 rounded cursor-pointer"
                />
                <Input
                  value={settings.primaryColor}
                  onChange={(e) => handleSaveSettings({ primaryColor: e.target.value })}
                  className="w-32"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      {/* Notification Settings */}
      <TabsContent value="notifications" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Manage your notification preferences.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <Label htmlFor="emailNotifications">Email Notifications</Label>
                <span className="text-xs text-muted-foreground">Receive email notifications</span>
              </div>
              <Switch
                id="emailNotifications"
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => handleSaveSettings({ emailNotifications: checked })}
              />
            </div>
            
            {/* Role-specific notification settings */}
            {role === "BUYER" && (
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="orderStatusNotifications">Order Status Updates</Label>
                  <span className="text-xs text-muted-foreground">Get notified when order status changes</span>
                </div>
                <Switch
                  id="orderStatusNotifications"
                  checked={settings.orderStatusNotifications || false}
                  onCheckedChange={(checked) => handleSaveSettings({ orderStatusNotifications: checked })}
                />
              </div>
            )}
            
            {role === "MEDIATOR" && (
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="disputeNotifications">Dispute Notifications</Label>
                  <span className="text-xs text-muted-foreground">Get notified about new disputes</span>
                </div>
                <Switch
                  id="disputeNotifications"
                  checked={settings.disputeNotifications || false}
                  onCheckedChange={(checked) => handleSaveSettings({ disputeNotifications: checked })}
                />
              </div>
            )}
            
            {(role === "ADMIN" || role === "MEDIATOR") && (
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="systemAlerts">System Alerts</Label>
                  <span className="text-xs text-muted-foreground">Receive system-level notifications</span>
                </div>
                <Switch
                  id="systemAlerts"
                  checked={settings.systemAlerts || false}
                  onCheckedChange={(checked) => handleSaveSettings({ systemAlerts: checked })}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      
      {/* Buyer-specific Settings */}
      {role === "BUYER" && (
        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>Manage your payment preferences for orders.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="upiId">UPI ID</Label>
                <div className="flex gap-2">
                  <Input 
                    id="upiId" 
                    placeholder="yourname@upi" 
                    value={upiId} 
                    onChange={(e) => setUpiId(e.target.value)}
                  />
                  <Button 
                    onClick={() => handleSaveSettings({ upiId: upiId })}
                    variant="secondary"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Your UPI ID will be used for payment transactions</p>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="showOrderHistory">Show Order History</Label>
                  <span className="text-xs text-muted-foreground">Display your order history on your profile</span>
                </div>
                <Switch
                  id="showOrderHistory"
                  checked={settings.showOrderHistory || false}
                  onCheckedChange={(checked) => handleSaveSettings({ showOrderHistory: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      )}
      
      {/* Mediator-specific Settings */}
      {role === "MEDIATOR" && (
        <TabsContent value="disputeSettings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dispute Management</CardTitle>
              <CardDescription>Configure how you handle disputes between buyers and sellers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="autoAssignDisputes">Auto-assign Disputes</Label>
                  <span className="text-xs text-muted-foreground">Automatically assign new disputes to you</span>
                </div>
                <Switch
                  id="autoAssignDisputes"
                  checked={settings.autoAssignDisputes || false}
                  onCheckedChange={(checked) => handleSaveSettings({ autoAssignDisputes: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="disputeResponseTime">Response Time Preferences</Label>
                  <span className="text-xs text-muted-foreground">Set your preferred response time for disputes</span>
                </div>
                <Select 
                  value={settings.disputeResponseTime || "24h"}
                  onValueChange={(value) => handleSaveSettings({ disputeResponseTime: value })}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Response Time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4h">4 hours</SelectItem>
                    <SelectItem value="8h">8 hours</SelectItem>
                    <SelectItem value="24h">24 hours</SelectItem>
                    <SelectItem value="48h">48 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="mediatorBio">Mediator Bio</Label>
                <Input 
                  id="mediatorBio" 
                  placeholder="Brief description about yourself as a mediator" 
                  value={settings.mediatorBio || ""} 
                  onChange={(e) => handleSaveSettings({ mediatorBio: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">This will be visible to users when they select a mediator</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      )}
      
      {/* Admin-specific Settings */}
      {role === "ADMIN" && (
        <TabsContent value="adminSettings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Admin Dashboard Preferences</CardTitle>
              <CardDescription>Configure your admin dashboard view and options.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="adminDashboardView">Default Dashboard View</Label>
                  <span className="text-xs text-muted-foreground">Choose your preferred dashboard view</span>
                </div>
                <Select 
                  value={settings.adminDashboardView || "summary"}
                  onValueChange={(value) => handleSaveSettings({ adminDashboardView: value })}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Dashboard View" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="summary">Summary</SelectItem>
                    <SelectItem value="orders">Orders</SelectItem>
                    <SelectItem value="users">Users</SelectItem>
                    <SelectItem value="analytics">Analytics</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="enableAdvancedFeatures">Advanced Features</Label>
                  <span className="text-xs text-muted-foreground">Enable experimental admin features</span>
                </div>
                <Switch
                  id="enableAdvancedFeatures"
                  checked={settings.enableAdvancedFeatures || false}
                  onCheckedChange={(checked) => handleSaveSettings({ enableAdvancedFeatures: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="logsRetentionDays">Logs Retention (days)</Label>
                  <span className="text-xs text-muted-foreground">How long to keep system logs</span>
                </div>
                <Select 
                  value={String(settings.logsRetentionDays || "30")}
                  onValueChange={(value) => handleSaveSettings({ logsRetentionDays: parseInt(value) })}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue placeholder="Days" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7</SelectItem>
                    <SelectItem value="14">14</SelectItem>
                    <SelectItem value="30">30</SelectItem>
                    <SelectItem value="60">60</SelectItem>
                    <SelectItem value="90">90</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      )}
      
      {/* Footer with reset button */}
      <div className="flex justify-end mt-6">
        <Button
          variant="outline"
          onClick={() => resetSettings()}
          className="mr-2"
        >
          Reset all settings
        </Button>
      </div>
    </SettingsLayout>
  );
}
