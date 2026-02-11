import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Zap,
  Shield,
  Users,
  Bot,
  CheckCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';

import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import githubService from '../services/githubService';
import recommendationsService from '../services/recommendationsService';
import type { Recommendation } from '../types';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  security: <Shield className="w-5 h-5 text-red-400" />,
  access: <Users className="w-5 h-5 text-yellow-400" />,
  copilot: <Bot className="w-5 h-5 text-indigo-400" />,
  compliance: <CheckCircle className="w-5 h-5 text-green-400" />,
};

const PRIORITY_STYLES: Record<string, string> = {
  critical: 'border-red-500/30 bg-red-500/5',
  high: 'border-yellow-500/30 bg-yellow-500/5',
  medium: 'border-blue-500/30 bg-blue-500/5',
  low: 'border-gray-600/30 bg-gray-600/5',
};

const PRIORITY_BADGE: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-400',
  high: 'bg-yellow-500/20 text-yellow-400',
  medium: 'bg-blue-500/20 text-blue-400',
  low: 'bg-gray-500/20 text-gray-400',
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
};

export default function RecommendationsPage() {
  const { token } = useAuth();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  const loadRecommendations = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const orgs = await githubService.getOrganizations();
      if (orgs.length === 0) {
        setRecommendations([]);
        setLoading(false);
        return;
      }
      const recs = await recommendationsService.generateAll(orgs.map((o) => o.login));
      setRecommendations(recs);
    } catch (err) {
      console.error('Failed to generate recommendations:', err);
      setError('Failed to analyze your organizations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const visible = recommendations
    .filter((r) => !dismissed.has(r.id))
    .filter((r) => !categoryFilter || r.category === categoryFilter);

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Stats
  const criticalCount = recommendations.filter(
    (r) => r.priority === 'critical' && !dismissed.has(r.id)
  ).length;
  const highCount = recommendations.filter(
    (r) => r.priority === 'high' && !dismissed.has(r.id)
  ).length;
  const autoFixCount = recommendations.filter(
    (r) => r.autoFixAvailable && !dismissed.has(r.id)
  ).length;

  return (
    <div className="space-y-6 max-w-7xl">
        {/* Actions Bar */}
        <div className="flex items-center justify-end">
          <Button variant="ghost" size="sm" onClick={loadRecommendations} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-brand-primary animate-spin mx-auto mb-4" />
              <p className="text-dark-text-muted">Analyzing your organizations...</p>
              <p className="text-dark-text-muted text-sm mt-1">
                Checking 2FA, access patterns, Copilot usage & more
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <Card className="p-8 text-center">
            <Shield className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-dark-text mb-4">{error}</p>
            <Button onClick={loadRecommendations}>Try Again</Button>
          </Card>
        )}

        {/* Content */}
        {!loading && !error && (
          <>
            {/* Summary stats */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
            >
              <Card className="p-4">
                <p className="text-dark-text-muted text-sm">Total</p>
                <p className="text-2xl font-bold text-dark-text">
                  {recommendations.length - dismissed.size}
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-dark-text-muted text-sm">Critical</p>
                <p className="text-2xl font-bold text-red-400">{criticalCount}</p>
              </Card>
              <Card className="p-4">
                <p className="text-dark-text-muted text-sm">High</p>
                <p className="text-2xl font-bold text-yellow-400">{highCount}</p>
              </Card>
              <Card className="p-4">
                <p className="text-dark-text-muted text-sm">Auto-Fixable</p>
                <p className="text-2xl font-bold text-green-400">{autoFixCount}</p>
              </Card>
            </motion.div>

            {/* Category filter */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-2 mb-6 flex-wrap"
            >
              {['', 'security', 'access', 'copilot', 'compliance'].map((cat) => (
                <button
                  key={cat || 'all'}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    categoryFilter === cat
                      ? 'bg-brand-primary text-white'
                      : 'text-dark-text-muted hover:text-dark-text hover:bg-white/5'
                  }`}
                >
                  {cat ? cat.charAt(0).toUpperCase() + cat.slice(1) : 'All'}
                </button>
              ))}
            </motion.div>

            {/* Recommendations list */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-4"
            >
              {visible.length === 0 && (
                <Card className="p-12 text-center">
                  <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4 opacity-50" />
                  <p className="text-xl font-semibold text-green-400 mb-2">All Clear!</p>
                  <p className="text-dark-text-muted">
                    {recommendations.length === 0
                      ? 'No recommendations at this time.'
                      : 'All recommendations have been dismissed.'}
                  </p>
                </Card>
              )}

              {visible.map((rec) => (
                <motion.div key={rec.id} variants={itemVariants}>
                  <div
                    className={`border rounded-2xl p-6 ${PRIORITY_STYLES[rec.priority]} transition-all`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        {CATEGORY_ICONS[rec.category]}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${PRIORITY_BADGE[rec.priority]}`}
                            >
                              {rec.priority}
                            </span>
                            <h3 className="text-dark-text font-semibold">{rec.title}</h3>
                          </div>
                          <p className="text-dark-text-muted text-sm mb-2">{rec.description}</p>
                          <p className="text-green-400 text-sm flex items-center gap-1">
                            <Zap size={14} /> {rec.estimatedImpact}
                          </p>

                          {/* Expandable affected entities */}
                          {rec.affectedEntities.length > 0 && (
                            <button
                              onClick={() => toggleExpanded(rec.id)}
                              className="mt-2 text-dark-text-muted text-xs hover:text-dark-text flex items-center gap-1"
                            >
                              {expanded.has(rec.id) ? (
                                <ChevronUp size={12} />
                              ) : (
                                <ChevronDown size={12} />
                              )}
                              {rec.affectedEntities.length} affected {rec.affectedEntities[0].type}
                              (s)
                            </button>
                          )}
                          {expanded.has(rec.id) && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {rec.affectedEntities.slice(0, 20).map((e) => (
                                <a
                                  key={e.name}
                                  href={
                                    e.type === 'user'
                                      ? `https://github.com/${e.name}`
                                      : e.type === 'repo'
                                        ? `https://github.com/${e.name}`
                                        : '#'
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2 py-1 bg-white/5 rounded text-xs text-indigo-400 hover:bg-white/10 flex items-center gap-1"
                                >
                                  {e.name}
                                  <ExternalLink size={10} />
                                </a>
                              ))}
                              {rec.affectedEntities.length > 20 && (
                                <span className="px-2 py-1 text-xs text-dark-text-muted">
                                  +{rec.affectedEntities.length - 20} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        {rec.autoFixAvailable && (
                          <Button size="sm" className="text-xs">
                            <Zap size={14} className="mr-1" />
                            Auto-Fix
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDismissed((prev) => new Set([...prev, rec.id]))}
                          className="text-xs"
                        >
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </>
        )}
    </div>
  );
}
