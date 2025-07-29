// Notification Service for GitSecureOps
// Handles real-time notifications, Slack/Teams integration, and browser notifications

export interface NotificationConfig {
  id: string;
  type: 'slack' | 'teams' | 'email' | 'browser';
  enabled: boolean;
  webhook?: string;
  channel?: string;
  settings?: Record<string, any>;
}

export interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  action?: string;
  metadata?: Record<string, any>;
  read?: boolean;
}

export interface NotificationRule {
  id: string;
  name: string;
  enabled: boolean;
  conditions: {
    events: string[];
    severity: ('low' | 'medium' | 'high' | 'critical')[];
    repositories?: string[];
    users?: string[];
  };
  actions: {
    channels: ('slack' | 'teams' | 'email' | 'browser')[];
    template?: string;
    mentions?: string[];
  };
}

class NotificationService {
  private notifications: Notification[] = [];
  private configs: NotificationConfig[] = [];
  private rules: NotificationRule[] = [];
  private listeners: ((notification: Notification) => void)[] = [];

  constructor() {
    this.loadConfigurations();
    this.initializeBrowserNotifications();
  }

  // Configuration Management
  private loadConfigurations() {
    try {
      const stored = localStorage.getItem('notification_configs');
      if (stored) {
        this.configs = JSON.parse(stored);
      }

      const storedRules = localStorage.getItem('notification_rules');
      if (storedRules) {
        this.rules = JSON.parse(storedRules);
      }

      // Set default configurations if none exist
      if (this.configs.length === 0) {
        this.setDefaultConfigurations();
      }
    } catch (error) {
      console.error('Failed to load notification configurations:', error);
      this.setDefaultConfigurations();
    }
  }

  private setDefaultConfigurations() {
    this.configs = [
      {
        id: 'browser',
        type: 'browser',
        enabled: true,
        settings: {
          showOnDesktop: true,
          playSound: true,
          autoClose: 5000
        }
      },
      {
        id: 'slack',
        type: 'slack',
        enabled: false,
        webhook: '',
        channel: '#github-ops',
        settings: {
          mentionOnCritical: true,
          includeMetadata: true
        }
      },
      {
        id: 'teams',
        type: 'teams',
        enabled: false,
        webhook: '',
        settings: {
          includeActionCards: true,
          mentionOnCritical: true
        }
      }
    ];

    this.rules = [
      {
        id: 'critical-actions',
        name: 'Critical Security Actions',
        enabled: true,
        conditions: {
          events: ['user_access_removed', 'bulk_operation_completed', 'permission_elevated'],
          severity: ['high', 'critical']
        },
        actions: {
          channels: ['browser', 'slack', 'teams'],
          mentions: ['@channel']
        }
      },
      {
        id: 'bulk-operations',
        name: 'Bulk Operations',
        enabled: true,
        conditions: {
          events: ['bulk_operation_started', 'bulk_operation_completed', 'bulk_operation_failed'],
          severity: ['medium', 'high']
        },
        actions: {
          channels: ['browser', 'slack']
        }
      }
    ];

    this.saveConfigurations();
  }

  private saveConfigurations() {
    try {
      localStorage.setItem('notification_configs', JSON.stringify(this.configs));
      localStorage.setItem('notification_rules', JSON.stringify(this.rules));
    } catch (error) {
      console.error('Failed to save notification configurations:', error);
    }
  }

  // Browser Notifications
  private async initializeBrowserNotifications() {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
    }
  }

  private showBrowserNotification(notification: Notification) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    const config = this.configs.find(c => c.type === 'browser' && c.enabled);
    if (!config) return;

    const browserNotif = new Notification(notification.title, {
      body: notification.message,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: notification.id,
      requireInteraction: notification.type === 'error'
    });

    // Auto-close after configured time
    if (config.settings?.autoClose) {
      setTimeout(() => {
        browserNotif.close();
      }, config.settings.autoClose);
    }

    browserNotif.onclick = () => {
      window.focus();
      browserNotif.close();
      // You can add navigation logic here
    };
  }

  // Slack Integration
  private async sendSlackNotification(notification: Notification) {
    const config = this.configs.find(c => c.type === 'slack' && c.enabled);
    if (!config || !config.webhook) return;

    const color = this.getSlackColor(notification.type);
    const payload = {
      channel: config.channel,
      username: 'GitSecureOps',
      icon_emoji: ':lock:',
      attachments: [
        {
          color: color,
          title: notification.title,
          text: notification.message,
          timestamp: Math.floor(notification.timestamp.getTime() / 1000),
          fields: [
            {
              title: 'Action',
              value: notification.action || 'N/A',
              short: true
            },
            {
              title: 'Type',
              value: notification.type.toUpperCase(),
              short: true
            }
          ],
          footer: 'GitSecureOps',
          footer_icon: 'https://github.com/favicon.ico'
        }
      ]
    };

    // Add metadata fields if available
    if (notification.metadata && config.settings?.includeMetadata) {
      Object.entries(notification.metadata).forEach(([key, value]) => {
        payload.attachments[0].fields.push({
          title: key.charAt(0).toUpperCase() + key.slice(1),
          value: String(value),
          short: true
        });
      });
    }

    try {
      const response = await fetch(config.webhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Slack webhook failed: ${response.status}`);
      }

      console.log('✅ Slack notification sent successfully');
    } catch (error) {
      console.error('❌ Failed to send Slack notification:', error);
    }
  }

  // Microsoft Teams Integration
  private async sendTeamsNotification(notification: Notification) {
    const config = this.configs.find(c => c.type === 'teams' && c.enabled);
    if (!config || !config.webhook) return;

    const color = this.getTeamsColor(notification.type);
    const payload: any = {
      '@type': 'MessageCard',
      '@context': 'https://schema.org/extensions',
      summary: notification.title,
      themeColor: color,
      sections: [
        {
          activityTitle: notification.title,
          activitySubtitle: 'GitSecureOps Notification',
          activityImage: 'https://github.com/favicon.ico',
          text: notification.message,
          facts: [
            {
              name: 'Type',
              value: notification.type.toUpperCase()
            },
            {
              name: 'Action',
              value: notification.action || 'N/A'
            },
            {
              name: 'Time',
              value: notification.timestamp.toLocaleString()
            }
          ]
        }
      ]
    };

    // Add metadata facts if available
    if (notification.metadata) {
      Object.entries(notification.metadata).forEach(([key, value]) => {
        payload.sections[0].facts.push({
          name: key.charAt(0).toUpperCase() + key.slice(1),
          value: String(value)
        });
      });
    }

    // Add action cards if enabled
    if (config.settings?.includeActionCards) {
      payload.potentialAction = [
        {
          '@type': 'OpenUri',
          name: 'Open GitSecureOps',
          targets: [
            {
              os: 'default',
              uri: window.location.origin
            }
          ]
        }
      ];
    }

    try {
      const response = await fetch(config.webhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Teams webhook failed: ${response.status}`);
      }

      console.log('✅ Teams notification sent successfully');
    } catch (error) {
      console.error('❌ Failed to send Teams notification:', error);
    }
  }

  // Utility Methods
  private getSlackColor(type: string): string {
    switch (type) {
      case 'success': return 'good';
      case 'warning': return 'warning';
      case 'error': return 'danger';
      default: return '#36a3eb';
    }
  }

  private getTeamsColor(type: string): string {
    switch (type) {
      case 'success': return '28a745';
      case 'warning': return 'ffc107';
      case 'error': return 'dc3545';
      default: return '007bff';
    }
  }

  // Public API
  async notify(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) {
    const fullNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false
    };

    // Store notification
    this.notifications.unshift(fullNotification);
    
    // Keep only last 100 notifications
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }

    // Check if notification matches any rules
    const matchingRules = this.rules.filter(rule => 
      rule.enabled && this.matchesRule(fullNotification, rule)
    );

    // Send notifications based on matching rules
    for (const rule of matchingRules) {
      for (const channel of rule.actions.channels) {
        switch (channel) {
          case 'browser':
            this.showBrowserNotification(fullNotification);
            break;
          case 'slack':
            await this.sendSlackNotification(fullNotification);
            break;
          case 'teams':
            await this.sendTeamsNotification(fullNotification);
            break;
        }
      }
    }

    // Notify listeners
    this.listeners.forEach(listener => listener(fullNotification));

    console.log('📢 Notification sent:', fullNotification);
  }

  private matchesRule(notification: Notification, rule: NotificationRule): boolean {
    // Check if event type matches (we'll need to add event field to notification)
    if (rule.conditions.events.length > 0 && notification.action) {
      if (!rule.conditions.events.includes(notification.action)) {
        return false;
      }
    }

    // For now, we'll match based on notification type severity
    const severityMap: Record<string, string> = {
      'info': 'low',
      'success': 'medium', 
      'warning': 'high',
      'error': 'critical'
    };

    const notificationSeverity = severityMap[notification.type] || 'low';
    return rule.conditions.severity.includes(notificationSeverity as any);
  }

  // Configuration Management API
  getConfigurations(): NotificationConfig[] {
    return [...this.configs];
  }

  updateConfiguration(config: NotificationConfig) {
    const index = this.configs.findIndex(c => c.id === config.id);
    if (index >= 0) {
      this.configs[index] = config;
    } else {
      this.configs.push(config);
    }
    this.saveConfigurations();
  }

  getRules(): NotificationRule[] {
    return [...this.rules];
  }

  updateRule(rule: NotificationRule) {
    const index = this.rules.findIndex(r => r.id === rule.id);
    if (index >= 0) {
      this.rules[index] = rule;
    } else {
      this.rules.push(rule);
    }
    this.saveConfigurations();
  }

  // Notification Management API
  getNotifications(): Notification[] {
    return [...this.notifications];
  }

  markAsRead(notificationId: string) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
    }
  }

  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
  }

  clearNotifications() {
    this.notifications = [];
  }

  // Event Listeners
  onNotification(callback: (notification: Notification) => void) {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Quick notification methods for common use cases
  success(title: string, message: string, action?: string, metadata?: Record<string, any>) {
    return this.notify({
      type: 'success',
      title,
      message,
      action,
      metadata
    });
  }

  warning(title: string, message: string, action?: string, metadata?: Record<string, any>) {
    return this.notify({
      type: 'warning',
      title,
      message,
      action,
      metadata
    });
  }

  error(title: string, message: string, action?: string, metadata?: Record<string, any>) {
    return this.notify({
      type: 'error',
      title,
      message,
      action,
      metadata
    });
  }

  info(title: string, message: string, action?: string, metadata?: Record<string, any>) {
    return this.notify({
      type: 'info',
      title,
      message,
      action,
      metadata
    });
  }
}

export const notificationService = new NotificationService();
export default notificationService;
