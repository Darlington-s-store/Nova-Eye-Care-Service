import React, { useState, useEffect } from 'react';
import { Bell, Smartphone, CheckCircle2, AlertCircle, RefreshCw, Send, ShieldCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/lib/api';
import {
  requestPushNotificationPermission,
  unregisterPushNotifications,
  getDevicePlatform,
  onForegroundMessageListener
} from '@/lib/firebase';

interface NotificationPromptProps {
  compact?: boolean;
  onDismiss?: () => void;
}

export const NotificationPrompt: React.FC<NotificationPromptProps> = ({
  compact = false,
  onDismiss
}) => {
  const { toast } = useToast();
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [platform, setPlatform] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [permissionState, setPermissionState] = useState<NotificationPermission | 'unsupported'>('default');

  useEffect(() => {
    setPlatform(getDevicePlatform());

    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionState(Notification.permission);
      const savedToken = localStorage.getItem('nova_fcm_token');
      const pushEnabled = localStorage.getItem('nova_push_enabled') === 'true';
      if (Notification.permission === 'granted' && (savedToken || pushEnabled)) {
        setIsEnabled(true);
      }
    } else {
      setPermissionState('unsupported');
    }

    // Register foreground push listener
    interface ForegroundPayload {
      notification?: { title?: string; body?: string };
      data?: { title?: string; body?: string };
    }

    onForegroundMessageListener((payload: unknown) => {
      const p = payload as ForegroundPayload | undefined;
      const title = p?.notification?.title || p?.data?.title || 'Nova Eye Care';
      const body = p?.notification?.body || p?.data?.body || 'New update available.';
      toast({
        title: `🔔 ${title}`,
        description: body,
      });
    });
  }, [toast]);

  const handleEnablePush = async () => {
    setIsLoading(true);
    try {
      const result = await requestPushNotificationPermission();
      if (result.success) {
        setIsEnabled(true);
        setPermissionState('granted');
        toast({
          title: 'Push Notifications Active',
          description: `Your ${platform === 'mobile' ? 'phone' : 'device'} is now connected to instant appointment alerts!`,
        });
      } else {
        toast({
          title: 'Could Not Enable Notifications',
          description: result.error || 'Please allow notifications in your browser settings.',
          variant: 'destructive',
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to initialize device notifications.';
      toast({
        title: 'Notification Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisablePush = async () => {
    setIsLoading(true);
    try {
      await unregisterPushNotifications();
      setIsEnabled(false);
      toast({
        title: 'Push Notifications Disabled',
        description: 'You will no longer receive push alerts on this device.',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to remove device registration.';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestPush = async () => {
    setIsTesting(true);
    try {
      const response = await apiService.notifications.sendTestPush();
      toast({
        title: 'Test Notification Sent!',
        description: response.message || 'Check your phone/device notification shade.',
      });
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
      const message = apiErr?.response?.data?.message || apiErr?.message || 'Could not dispatch test push.';
      toast({
        title: 'Test Push Failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsTesting(false);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center justify-between p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800/80 dark:to-indigo-950/40 rounded-xl border border-blue-200/60 dark:border-blue-900/40 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600/10 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
            {platform === 'mobile' ? <Smartphone className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Phone & Device Alerts
              </span>
              {isEnabled ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                  <CheckCircle2 className="w-3 h-3" /> Active
                </span>
              ) : (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                  Off
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Instant appointment reminders directly on your screen
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isEnabled ? (
            <Button
              size="sm"
              variant="outline"
              onClick={handleTestPush}
              disabled={isTesting}
              className="text-xs h-8 px-2.5 gap-1.5 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
            >
              {isTesting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
              Test Alert
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleEnablePush}
              disabled={isLoading}
              className="text-xs h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-sm"
            >
              {isLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Bell className="w-3 h-3" />}
              Enable
            </Button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-blue-200/80 dark:border-blue-900/50 bg-gradient-to-br from-white via-blue-50/40 to-indigo-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/30 p-6 shadow-sm">
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      <div className="flex items-start gap-4">
        <div className="relative flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
          <Smartphone className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[9px] text-white">
            ✓
          </span>
        </div>

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Instant Phone Notifications
            </h3>
            {isEnabled ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/40">
                <CheckCircle2 className="w-3.5 h-3.5" /> Enabled on {platform}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/40">
                <AlertCircle className="w-3.5 h-3.5" /> Not Enabled
              </span>
            )}
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 max-w-xl leading-relaxed">
            Receive real-time push alerts on your phone or device whenever an appointment is confirmed, rescheduled, or cancelled, as well as critical clinical updates.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            {isEnabled ? (
              <>
                <Button
                  onClick={handleTestPush}
                  disabled={isTesting}
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm font-semibold"
                >
                  {isTesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Send Test Alert
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDisablePush}
                  disabled={isLoading}
                  className="text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                >
                  Disable Alerts
                </Button>
              </>
            ) : (
              <Button
                onClick={handleEnablePush}
                disabled={isLoading || permissionState === 'unsupported'}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white gap-2 shadow-md shadow-blue-600/25 font-semibold px-5"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
                Enable Phone Notifications
              </Button>
            )}

            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Private & secure FCM push channel</span>
            </div>
          </div>

          {platform === 'mobile' && !isEnabled && (
            <div className="mt-3 text-[12px] text-slate-500 dark:text-slate-400 bg-white/70 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60 inline-block">
              📱 <strong>Tip for iPhone users:</strong> Tap Share <span className="font-mono text-xs">⎋</span> and select <strong>"Add to Home Screen"</strong> to receive push notifications even when Safari is closed!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationPrompt;
