'use client';

import { useState } from 'react';
import { 
  Mail, 
  Shield, 
  Plug, 
  Settings as SettingsIcon,
  Save,
  Clock,
  Key,
  Globe,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

export default function SystemSettingsPage() {
  const { toast } = useToast();
  const [emailSettings, setEmailSettings] = useState({
    smtpHost: 'smtp.gmail.com',
    smtpPort: '587',
    smtpUser: 'noreply@example.com',
    smtpPassword: '••••••••',
    dailyLimit: '500',
    retryAttempts: '3',
    retryDelay: '300',
    enableTLS: true,
  });

  const [securitySettings, setSecuritySettings] = useState({
    jwtExpiration: '24',
    sessionTimeout: '30',
    minPasswordLength: '8',
    requireUppercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    enable2FA: false,
  });

  const [integrationSettings, setIntegrationSettings] = useState({
    apiKey: 'gat_••••••••••••••••',
    webhookUrl: 'https://example.com/webhook',
    slackWebhook: '',
    enableWebhooks: true,
  });

  const [systemSettings, setSystemSettings] = useState({
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    language: 'en',
    enableLogging: true,
  });

  const handleSaveEmailSettings = () => {
    toast({
      title: "Email settings saved",
      description: "Your email configuration has been updated successfully.",
    });
  };

  const handleSaveSecuritySettings = () => {
    toast({
      title: "Security settings saved",
      description: "Your security configuration has been updated successfully.",
    });
  };

  const handleSaveIntegrationSettings = () => {
    toast({
      title: "Integration settings saved",
      description: "Your integration configuration has been updated successfully.",
    });
  };

  const handleSaveSystemSettings = () => {
    toast({
      title: "System settings saved",
      description: "Your system configuration has been updated successfully.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure email, security, integrations, and system preferences
        </p>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="email" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="email">
            <Mail className="h-4 w-4 mr-2" />
            Email
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <Plug className="h-4 w-4 mr-2" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="system">
            <SettingsIcon className="h-4 w-4 mr-2" />
            System
          </TabsTrigger>
        </TabsList>

        {/* Email Settings Tab */}
        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SMTP Configuration</CardTitle>
              <CardDescription>
                Configure your SMTP server settings for sending emails
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp-host">SMTP Host</Label>
                  <Input
                    id="smtp-host"
                    value={emailSettings.smtpHost}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpHost: e.target.value })}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-port">SMTP Port</Label>
                  <Input
                    id="smtp-port"
                    value={emailSettings.smtpPort}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpPort: e.target.value })}
                    placeholder="587"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-user">SMTP Username</Label>
                  <Input
                    id="smtp-user"
                    value={emailSettings.smtpUser}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpUser: e.target.value })}
                    placeholder="noreply@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-password">SMTP Password</Label>
                  <Input
                    id="smtp-password"
                    type="password"
                    value={emailSettings.smtpPassword}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpPassword: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="enable-tls"
                  checked={emailSettings.enableTLS}
                  onCheckedChange={(checked) => setEmailSettings({ ...emailSettings, enableTLS: checked })}
                />
                <Label htmlFor="enable-tls">Enable TLS/SSL</Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sending Limits & Retry Settings</CardTitle>
              <CardDescription>
                Configure daily sending limits and retry behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="daily-limit">Daily Sending Limit</Label>
                  <Input
                    id="daily-limit"
                    type="number"
                    value={emailSettings.dailyLimit}
                    onChange={(e) => setEmailSettings({ ...emailSettings, dailyLimit: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retry-attempts">Retry Attempts</Label>
                  <Input
                    id="retry-attempts"
                    type="number"
                    value={emailSettings.retryAttempts}
                    onChange={(e) => setEmailSettings({ ...emailSettings, retryAttempts: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retry-delay">Retry Delay (seconds)</Label>
                  <Input
                    id="retry-delay"
                    type="number"
                    value={emailSettings.retryDelay}
                    onChange={(e) => setEmailSettings({ ...emailSettings, retryDelay: e.target.value })}
                  />
                </div>
              </div>

              <Button onClick={handleSaveEmailSettings}>
                <Save className="h-4 w-4 mr-2" />
                Save Email Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Authentication Settings</CardTitle>
              <CardDescription>
                Configure JWT and session timeout settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="jwt-expiration">JWT Expiration (hours)</Label>
                  <Input
                    id="jwt-expiration"
                    type="number"
                    value={securitySettings.jwtExpiration}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, jwtExpiration: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                  <Input
                    id="session-timeout"
                    type="number"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeout: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="enable-2fa"
                  checked={securitySettings.enable2FA}
                  onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, enable2FA: checked })}
                />
                <Label htmlFor="enable-2fa">Enable Two-Factor Authentication</Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Password Requirements</CardTitle>
              <CardDescription>
                Configure password complexity requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="min-password-length">Minimum Password Length</Label>
                <Input
                  id="min-password-length"
                  type="number"
                  value={securitySettings.minPasswordLength}
                  onChange={(e) => setSecuritySettings({ ...securitySettings, minPasswordLength: e.target.value })}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="require-uppercase"
                    checked={securitySettings.requireUppercase}
                    onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, requireUppercase: checked })}
                  />
                  <Label htmlFor="require-uppercase">Require Uppercase Letters</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="require-numbers"
                    checked={securitySettings.requireNumbers}
                    onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, requireNumbers: checked })}
                  />
                  <Label htmlFor="require-numbers">Require Numbers</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="require-special"
                    checked={securitySettings.requireSpecialChars}
                    onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, requireSpecialChars: checked })}
                  />
                  <Label htmlFor="require-special">Require Special Characters</Label>
                </div>
              </div>

              <Button onClick={handleSaveSecuritySettings}>
                <Save className="h-4 w-4 mr-2" />
                Save Security Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integration Settings Tab */}
        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Configuration</CardTitle>
              <CardDescription>
                Manage API keys and webhook integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-key">API Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="api-key"
                    value={integrationSettings.apiKey}
                    onChange={(e) => setIntegrationSettings({ ...integrationSettings, apiKey: e.target.value })}
                    className="flex-1"
                  />
                  <Button variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerate
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhook-url">Webhook URL</Label>
                <Input
                  id="webhook-url"
                  value={integrationSettings.webhookUrl}
                  onChange={(e) => setIntegrationSettings({ ...integrationSettings, webhookUrl: e.target.value })}
                  placeholder="https://example.com/webhook"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slack-webhook">Slack Webhook URL (Optional)</Label>
                <Input
                  id="slack-webhook"
                  value={integrationSettings.slackWebhook}
                  onChange={(e) => setIntegrationSettings({ ...integrationSettings, slackWebhook: e.target.value })}
                  placeholder="https://hooks.slack.com/services/..."
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="enable-webhooks"
                  checked={integrationSettings.enableWebhooks}
                  onCheckedChange={(checked) => setIntegrationSettings({ ...integrationSettings, enableWebhooks: checked })}
                />
                <Label htmlFor="enable-webhooks">Enable Webhook Notifications</Label>
              </div>

              <Button onClick={handleSaveIntegrationSettings}>
                <Save className="h-4 w-4 mr-2" />
                Save Integration Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings Tab */}
        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Regional & Display Settings</CardTitle>
              <CardDescription>
                Configure timezone, date format, and language preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={systemSettings.timezone}
                    onValueChange={(value) => setSystemSettings({ ...systemSettings, timezone: value })}
                  >
                    <SelectTrigger id="timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                      <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                      <SelectItem value="Europe/London">London (GMT)</SelectItem>
                      <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date-format">Date Format</Label>
                  <Select
                    value={systemSettings.dateFormat}
                    onValueChange={(value) => setSystemSettings({ ...systemSettings, dateFormat: value })}
                  >
                    <SelectTrigger id="date-format">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time-format">Time Format</Label>
                  <Select
                    value={systemSettings.timeFormat}
                    onValueChange={(value) => setSystemSettings({ ...systemSettings, timeFormat: value })}
                  >
                    <SelectTrigger id="time-format">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12h">12 Hour</SelectItem>
                      <SelectItem value="24h">24 Hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={systemSettings.language}
                    onValueChange={(value) => setSystemSettings({ ...systemSettings, language: value })}
                  >
                    <SelectTrigger id="language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="enable-logging"
                  checked={systemSettings.enableLogging}
                  onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, enableLogging: checked })}
                />
                <Label htmlFor="enable-logging">Enable System Logging</Label>
              </div>

              <Button onClick={handleSaveSystemSettings}>
                <Save className="h-4 w-4 mr-2" />
                Save System Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
