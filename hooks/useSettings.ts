import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

// Default settings structure
const defaultSettings = {
  // Common settings
  darkMode: false,
  emailNotifications: true,
  language: 'en',
  showProfile: true,
  showEmail: false,
  primaryColor: '#7C3AED',
  
  // Buyer-specific settings
  showOrderHistory: true,
  defaultPaymentMethod: null,
  upiId: '',
  orderStatusNotifications: true,
  
  // Mediator-specific settings
  disputeNotifications: true,
  autoAssignDisputes: false,
  disputeResponseTime: '24h',
  mediatorBio: '',
  
  // Admin-specific settings
  adminDashboardView: 'summary',
  enableAdvancedFeatures: false,
  logsRetentionDays: 30,
  systemAlerts: true,
  
  // Additional settings
  additionalSettings: {},
};

export type UserSettings = typeof defaultSettings;

interface IUseSettings {
  settings: UserSettings;
  loading: boolean;
  error: string | null;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
}

export function useSettings(): IUseSettings {
  const { data: session, status } = useSession();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch settings when session is available
  useEffect(() => {
    if (status !== 'loading' && session?.user) {
      fetchSettings();
    }
  }, [session, status]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/settings');
      
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      
      const data = await response.json();
      setSettings({ ...defaultSettings, ...data });
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load settings');
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update settings');
      }
      
      const data = await response.json();
      setSettings({ ...settings, ...data.settings });
      toast.success('Settings updated successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to update settings');
      toast.error(`Error updating settings: ${err.message}`);
      console.error('Error updating settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetSettings = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(defaultSettings),
      });
      
      if (!response.ok) {
        throw new Error('Failed to reset settings');
      }
      
      const data = await response.json();
      setSettings({ ...defaultSettings, ...data.settings });
      toast.success('Settings reset to defaults');
    } catch (err: any) {
      setError(err.message || 'Failed to reset settings');
      toast.error(`Error resetting settings: ${err.message}`);
      console.error('Error resetting settings:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    settings,
    loading,
    error,
    updateSettings,
    resetSettings,
  };
} 