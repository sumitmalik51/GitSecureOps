import React, { useState, useEffect } from 'react';
import { Button, Input } from './ui';
import notificationService, { type NotificationConfig } from '../services/notificationService';

interface NotificationSettingsProps {
  onClose: () => void;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ onClose }) => {
  const [configs, setConfigs] = useState<NotificationConfig[]>([]);
  const [testingSlack, setTestingSlack] = useState(false);
  const [testingTeams, setTestingTeams] = useState(false);

  useEffect(() => {
    setConfigs(notificationService.getConfigurations());
  }, []);

  const updateConfig = (configId: string, updates: Partial<NotificationConfig>) => {
    const updatedConfigs = configs.map(config => 
      config.id === configId ? { ...config, ...updates } : config
    );
    setConfigs(updatedConfigs);
    
    const updatedConfig = updatedConfigs.find(c => c.id === configId);
    if (updatedConfig) {
      notificationService.updateConfiguration(updatedConfig);
    }
  };

  const testIntegration = async (type: 'slack' | 'teams') => {
    if (type === 'slack') {
      setTestingSlack(true);
    } else {
      setTestingTeams(true);
    }

    try {
      await notificationService.notify({
        type: 'info',
        title: '🧪 Test Notification',
        message: `This is a test notification from GitSecureOps to verify your ${type.charAt(0).toUpperCase() + type.slice(1)} integration is working correctly.`,
        action: 'test_notification',
        metadata: {
          test: true,
          timestamp: new Date().toISOString(),
          integration: type
        }
      });

      notificationService.success(
        'Test Sent!',
        `Test notification sent to ${type}. Check your ${type} channel.`
      );
    } catch (error) {
      notificationService.error(
        'Test Failed',
        `Failed to send test notification to ${type}. Please check your configuration.`
      );
    } finally {
      if (type === 'slack') {
        setTestingSlack(false);
      } else {
        setTestingTeams(false);
      }
    }
  };

  const requestBrowserPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        updateConfig('browser', { enabled: true });
        notificationService.success(
          'Browser Notifications Enabled',
          'You will now receive desktop notifications for important events.'
        );
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              🔔 Notification Settings
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl"
            >
              ×
            </button>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Configure how and when you receive notifications from GitSecureOps
          </p>
        </div>

        <div className="p-6 space-y-8">
          {/* Browser Notifications */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🖥️</span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Browser Notifications
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Desktop notifications in your browser
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={configs.find(c => c.id === 'browser')?.enabled || false}
                  onChange={(e) => updateConfig('browser', { enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {Notification.permission === 'default' && (
              <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                  🔒 Browser notification permission required
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={requestBrowserPermission}
                >
                  Grant Permission
                </Button>
              </div>
            )}

            {Notification.permission === 'denied' && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-200">
                  ❌ Browser notifications are blocked. Please enable them in your browser settings.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={configs.find(c => c.id === 'browser')?.settings?.playSound || false}
                    onChange={(e) => {
                      const config = configs.find(c => c.id === 'browser');
                      if (config) {
                        updateConfig('browser', {
                          settings: { ...config.settings, playSound: e.target.checked }
                        });
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Play sound</span>
                </label>
              </div>
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={configs.find(c => c.id === 'browser')?.settings?.showOnDesktop || false}
                    onChange={(e) => {
                      const config = configs.find(c => c.id === 'browser');
                      if (config) {
                        updateConfig('browser', {
                          settings: { ...config.settings, showOnDesktop: e.target.checked }
                        });
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Show on desktop</span>
                </label>
              </div>
            </div>
          </div>

          {/* Slack Integration */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">💬</span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Slack Integration
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Send notifications to your Slack workspace
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={configs.find(c => c.id === 'slack')?.enabled || false}
                  onChange={(e) => updateConfig('slack', { enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="space-y-4">
              <div>
                <Input
                  label="Webhook URL"
                  placeholder="https://hooks.slack.com/services/..."
                  value={configs.find(c => c.id === 'slack')?.webhook || ''}
                  onChange={(e) => updateConfig('slack', { webhook: e.target.value })}
                  helpText="Create a webhook in your Slack workspace settings"
                />
              </div>
              <div>
                <Input
                  label="Channel"
                  placeholder="#github-ops"
                  value={configs.find(c => c.id === 'slack')?.channel || ''}
                  onChange={(e) => updateConfig('slack', { channel: e.target.value })}
                  helpText="Channel where notifications will be sent"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={configs.find(c => c.id === 'slack')?.settings?.mentionOnCritical || false}
                    onChange={(e) => {
                      const config = configs.find(c => c.id === 'slack');
                      if (config) {
                        updateConfig('slack', {
                          settings: { ...config.settings, mentionOnCritical: e.target.checked }
                        });
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Mention @channel on critical alerts</span>
                </label>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => testIntegration('slack')}
                  loading={testingSlack}
                  disabled={!configs.find(c => c.id === 'slack')?.webhook}
                >
                  Test Integration
                </Button>
              </div>
            </div>
          </div>

          {/* Microsoft Teams Integration */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">👥</span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Microsoft Teams Integration
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Send notifications to your Teams channels
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={configs.find(c => c.id === 'teams')?.enabled || false}
                  onChange={(e) => updateConfig('teams', { enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="space-y-4">
              <div>
                <Input
                  label="Webhook URL"
                  placeholder="https://your-team.webhook.office.com/..."
                  value={configs.find(c => c.id === 'teams')?.webhook || ''}
                  onChange={(e) => updateConfig('teams', { webhook: e.target.value })}
                  helpText="Create an incoming webhook in your Teams channel"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={configs.find(c => c.id === 'teams')?.settings?.includeActionCards || false}
                    onChange={(e) => {
                      const config = configs.find(c => c.id === 'teams');
                      if (config) {
                        updateConfig('teams', {
                          settings: { ...config.settings, includeActionCards: e.target.checked }
                        });
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Include action cards</span>
                </label>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => testIntegration('teams')}
                  loading={testingTeams}
                  disabled={!configs.find(c => c.id === 'teams')?.webhook}
                >
                  Test Integration
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Setup Guide */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
              📖 Quick Setup Guide
            </h3>
            <div className="space-y-3 text-sm text-blue-800 dark:text-blue-200">
              <div>
                <strong>For Slack:</strong>
                <ol className="list-decimal list-inside ml-4 mt-1 space-y-1">
                  <li>Go to your Slack workspace settings</li>
                  <li>Navigate to "Apps" → "Incoming Webhooks"</li>
                  <li>Create a new webhook and copy the URL</li>
                  <li>Paste the URL above and test the integration</li>
                </ol>
              </div>
              <div>
                <strong>For Microsoft Teams:</strong>
                <ol className="list-decimal list-inside ml-4 mt-1 space-y-1">
                  <li>Go to your Teams channel</li>
                  <li>Click "..." → "Connectors" → "Incoming Webhook"</li>
                  <li>Configure the webhook and copy the URL</li>
                  <li>Paste the URL above and test the integration</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={() => {
              notificationService.success(
                'Settings Saved',
                'Your notification preferences have been updated successfully.'
              );
              onClose();
            }}
          >
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
