import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Download,
  Filter,
  Trash2,
  Clock,
  ArrowLeft,
  Search,
  Shield,
  UserMinus,
  UserPlus,
  Bot,
  Database,
  LogIn,
  LogOut,
  ScanLine,
  RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import auditLogService from '../services/auditLogService';
import type { AuditLogEntry, AuditAction } from '../types';

const ACTION_CONFIG: Record<AuditAction, { label: string; icon: React.ReactNode; color: string }> =
  {
    access_granted: {
      label: 'Access Granted',
      icon: <UserPlus size={16} />,
      color: 'text-green-400',
    },
    access_revoked: {
      label: 'Access Revoked',
      icon: <UserMinus size={16} />,
      color: 'text-red-400',
    },
    copilot_assigned: {
      label: 'Copilot Assigned',
      icon: <Bot size={16} />,
      color: 'text-indigo-400',
    },
    copilot_removed: {
      label: 'Copilot Removed',
      icon: <Bot size={16} />,
      color: 'text-yellow-400',
    },
    '2fa_scan': { label: '2FA Scan', icon: <ScanLine size={16} />, color: 'text-blue-400' },
    export_data: { label: 'Data Exported', icon: <Database size={16} />, color: 'text-purple-400' },
    bulk_removal: { label: 'Bulk Removal', icon: <Trash2 size={16} />, color: 'text-red-400' },
    login: { label: 'Login', icon: <LogIn size={16} />, color: 'text-green-400' },
    logout: { label: 'Logout', icon: <LogOut size={16} />, color: 'text-gray-400' },
  };

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.03 } },
};
const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 },
};

export default function AuditLogsPage() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<AuditLogEntry[]>(auditLogService.getAll());
  const [actionFilter, setActionFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const filtered = useMemo(() => {
    let result = entries;
    if (actionFilter) result = result.filter((e) => e.action === actionFilter);
    if (statusFilter) result = result.filter((e) => e.status === statusFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.actor.toLowerCase().includes(q) ||
          e.target?.toLowerCase().includes(q) ||
          e.org?.toLowerCase().includes(q) ||
          e.repo?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [entries, actionFilter, searchQuery, statusFilter]);

  const refresh = useCallback(() => {
    setEntries(auditLogService.getAll());
  }, []);

  const handleExport = useCallback(() => {
    const csv = auditLogService.exportCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleClear = useCallback(() => {
    if (window.confirm('Are you sure you want to clear all audit logs? This cannot be undone.')) {
      auditLogService.clear();
      setEntries([]);
    }
  }, []);

  // Stats
  const successCount = entries.filter((e) => e.status === 'success').length;
  const failureCount = entries.filter((e) => e.status === 'failure').length;

  return (
    <div className="min-h-screen bg-dark-bg p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-dark-text flex items-center gap-3">
                <FileText className="text-indigo-400" />
                Audit Logs
              </h1>
              <p className="text-dark-text-muted">Track all actions performed in GitSecureOps</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={refresh}>
              <RefreshCw className="w-4 h-4 mr-1" /> Refresh
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExport}
              disabled={entries.length === 0}
            >
              <Download className="w-4 h-4 mr-1" /> Export CSV
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={entries.length === 0}
              className="text-red-400 hover:text-red-300"
            >
              <Trash2 className="w-4 h-4 mr-1" /> Clear
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
        >
          <Card className="p-4">
            <p className="text-dark-text-muted text-sm">Total Entries</p>
            <p className="text-2xl font-bold text-dark-text">{entries.length}</p>
          </Card>
          <Card className="p-4">
            <p className="text-dark-text-muted text-sm">Successful</p>
            <p className="text-2xl font-bold text-green-400">{successCount}</p>
          </Card>
          <Card className="p-4">
            <p className="text-dark-text-muted text-sm">Failed</p>
            <p className="text-2xl font-bold text-red-400">{failureCount}</p>
          </Card>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-3 mb-6"
        >
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-text-muted" />
            <input
              type="text"
              placeholder="Search by user, org, repo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-dark-surface border border-dark-border rounded-lg text-dark-text placeholder-dark-text-muted focus:outline-none focus:border-brand-primary"
            />
          </div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-4 py-2 bg-dark-surface border border-dark-border rounded-lg text-dark-text focus:outline-none focus:border-brand-primary"
          >
            <option value="">All Actions</option>
            {Object.entries(ACTION_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>
                {cfg.label}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-dark-surface border border-dark-border rounded-lg text-dark-text focus:outline-none focus:border-brand-primary"
          >
            <option value="">All Status</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
          </select>
          {(actionFilter || searchQuery || statusFilter) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setActionFilter('');
                setSearchQuery('');
                setStatusFilter('');
              }}
            >
              <Filter className="w-4 h-4 mr-1" /> Clear Filters
            </Button>
          )}
        </motion.div>

        {/* Log Entries */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-2"
        >
          {filtered.length === 0 ? (
            <Card className="p-12 text-center">
              <Shield className="w-12 h-12 text-dark-text-muted mx-auto mb-4" />
              <p className="text-dark-text text-lg font-semibold mb-2">
                {entries.length === 0 ? 'No Audit Logs Yet' : 'No Matching Entries'}
              </p>
              <p className="text-dark-text-muted text-sm">
                {entries.length === 0
                  ? 'Actions like granting access, removing users, and running scans will appear here.'
                  : 'Try adjusting your filters to see more results.'}
              </p>
            </Card>
          ) : (
            filtered.map((entry) => {
              const config = ACTION_CONFIG[entry.action] || {
                label: entry.action,
                icon: <FileText size={16} />,
                color: 'text-gray-400',
              };
              return (
                <motion.div key={entry.id} variants={itemVariants}>
                  <Card className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Status badge */}
                        <div
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            entry.status === 'success'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {entry.status}
                        </div>
                        {/* Action icon + label */}
                        <div className={`flex items-center gap-2 ${config.color}`}>
                          {config.icon}
                          <span className="font-medium text-sm">{config.label}</span>
                        </div>
                        {/* Details */}
                        <span className="text-dark-text-muted text-sm">
                          by <span className="text-indigo-400">{entry.actor}</span>
                          {entry.target && (
                            <>
                              {' → '}
                              <span className="text-green-400">{entry.target}</span>
                            </>
                          )}
                          {entry.org && (
                            <>
                              {' in '}
                              <span className="text-yellow-400">{entry.org}</span>
                            </>
                          )}
                          {entry.repo && (
                            <>
                              {' / '}
                              <span className="text-blue-400">{entry.repo}</span>
                            </>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-dark-text-muted text-xs flex-shrink-0">
                        <Clock size={12} />
                        {new Date(entry.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })
          )}
        </motion.div>

        {/* Showing count */}
        {filtered.length > 0 && (
          <p className="text-dark-text-muted text-sm mt-4 text-center">
            Showing {filtered.length} of {entries.length} entries
          </p>
        )}
      </div>
    </div>
  );
}
