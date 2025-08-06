import React, { useState, useEffect } from 'react';
import { aiService, type AIRecommendation, type RepositoryActivity } from '../services/aiService';

interface SmartRecommendationsProps {
  onBack: () => void;
}

const SmartRecommendations: React.FC<SmartRecommendationsProps> = ({ onBack }) => {
  console.log('� SMART RECOMMENDATIONS PAGE LOADED!');
  
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // TODO: Re-enable when AI features are ready
  // const [riskAnalysis, setRiskAnalysis] = useState<{
  //   riskScore: number;
  //   risks: string[];
  //   recommendations: string[];
  // } | null>(null);

  useEffect(() => {
    console.log('🚀 SmartRecommendations component mounted');
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      console.log('🔍 Starting to load recommendations...');
      setLoading(true);
      setError('');

      // Mock data for demonstration - in real app, this would come from GitHub API
      const mockActivities: RepositoryActivity[] = [
        {
          repository: 'frontend-app',
          user: 'john.doe',
          lastAccess: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000), // 120 days ago
          accessCount: 5,
          permission: 'admin',
          commits: 0,
          issues: 0,
          pullRequests: 0
        },
        {
          repository: 'backend-api',
          user: 'jane.smith',
          lastAccess: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          accessCount: 45,
          permission: 'admin',
          commits: 2,
          issues: 1,
          pullRequests: 0
        },
        {
          repository: 'mobile-app',
          user: 'bob.wilson',
          lastAccess: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          accessCount: 120,
          permission: 'write',
          commits: 15,
          issues: 3,
          pullRequests: 8
        }
      ];

      // TODO: Remove mock data when AI features are enabled
      /* const mockPatterns: AccessPattern[] = [
        {
          user: 'john.doe',
          repositories: ['frontend-app', 'legacy-project'],
          permissions: ['admin', 'admin'],
          team: 'Frontend Team',
          role: 'Senior Developer',
          lastActivity: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000)
        },
        {
          user: 'jane.smith',
          repositories: ['backend-api', 'database-migrations'],
          permissions: ['admin', 'write'],
          team: 'Backend Team',
          role: 'Lead Developer',
          lastActivity: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      ]; */

      // Generate AI recommendations
      console.log('🤖 Calling AI service...');
      const recs = await aiService.generateAccessRecommendations();
      console.log('✅ Received recommendations:', recs);
      setRecommendations(recs);

      // Analyze security risks
      console.log('🔒 Analyzing security risks...');
      const analysis = await aiService.analyzeSecurityRisks(mockActivities);
      console.log('✅ Received analysis:', analysis);
      // TODO: Re-enable when AI features are ready
      // setRiskAnalysis(analysis);

    } catch (error: unknown) {
      const err = error as Error;
      setError(err.message || 'Failed to load recommendations');
      console.error('Error loading recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'stale_access':
        return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>;
      case 'permission_reduction':
        return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>;
      case 'security_risk':
        return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>;
      case 'compliance':
        return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>;
      case 'team_pattern':
        return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>;
      default:
        return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>;
    }
  };

  const handleApplyRecommendation = (rec: AIRecommendation) => {
    // This would integrate with your existing user management functions
    console.log('Applying recommendation:', rec);
    alert(`Would apply: ${rec.title}\nUser: ${rec.affectedUser}\nRepo: ${rec.affectedRepository}\nAction: ${rec.currentPermission} → ${rec.suggestedPermission || 'remove'}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
          </div>
          <h2 className="mt-6 text-xl font-bold text-gray-900 dark:text-white">Analyzing Access Patterns</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">AI is generating smart recommendations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="relative bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={onBack}
                className="inline-flex items-center px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200"
              >
                <span className="mr-2">←</span>
                <span className="font-medium">Back</span>
              </button>

              <div className="flex items-center space-x-3">
                {aiService.isConfigured() ? (
                  <div className="flex items-center px-3 py-1 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 rounded-full text-sm font-medium">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                    AI Enabled
                  </div>
                ) : (
                  <div className="flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded-full text-sm font-medium">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                    Coming Soon
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center space-x-4 mb-3">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    🤖 Smart Recommendations
                  </h1>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 font-medium max-w-4xl mx-auto">
                Preview of AI-powered insights for GitHub access management (Full AI features coming soon!)
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-8 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-700 rounded-xl p-6">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-lg font-bold text-red-800 dark:text-red-400">Error</h3>
                <p className="text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* AI Risk Analysis - Coming Soon */}
        <div className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl shadow-lg border-2 border-dashed border-blue-300 dark:border-blue-600 p-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">🤖 AI-Powered Risk Analysis</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">Coming Soon!</p>
            <p className="text-gray-500 dark:text-gray-500 max-w-2xl mx-auto">
              Advanced AI will analyze your repository access patterns, identify security risks, and provide intelligent recommendations for optimal access management.
            </p>
            <div className="mt-6 flex items-center justify-center space-x-2">
              <div className="animate-pulse w-3 h-3 bg-blue-400 rounded-full"></div>
              <div className="animate-pulse w-3 h-3 bg-purple-400 rounded-full" style={{animationDelay: '0.2s'}}></div>
              <div className="animate-pulse w-3 h-3 bg-blue-400 rounded-full" style={{animationDelay: '0.4s'}}></div>
            </div>
          </div>
        </div>

        {/* Current Risk Analysis Summary - Commented out for now */}
        {/* TODO: Re-enable when AI features are ready
        {false && riskAnalysis && (
          <div className="mb-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Security Risk Analysis</h2>
              <div className={`px-4 py-2 rounded-full font-bold ${
                riskAnalysis.riskScore > 0.7 ? 'bg-red-100 text-red-800' :
                riskAnalysis.riskScore > 0.4 ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                Risk Score: {Math.round(riskAnalysis.riskScore * 100)}%
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Identified Risks</h3>
                <ul className="space-y-2">
                  {riskAnalysis.risks.map((risk, index) => (
                    <li key={index} className="flex items-center text-gray-700 dark:text-gray-300">
                      <span className="w-2 h-2 bg-red-400 rounded-full mr-3"></span>
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Recommendations</h3>
                <ul className="space-y-2">
                  {riskAnalysis.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-center text-gray-700 dark:text-gray-300">
                      <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
        */}

        {/* Recommendations List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Sample Recommendations ({recommendations.length})
            </h2>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              🚧 AI-powered analysis coming soon! Currently showing sample data.
            </div>
            <button
              onClick={loadRecommendations}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Refresh Analysis
            </button>
          </div>

          {recommendations.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">All Good!</h3>
              <p className="text-gray-600 dark:text-gray-400">No security recommendations at this time.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {recommendations.map((rec) => (
                <div key={rec.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      <div className={`p-3 rounded-full ${getPriorityColor(rec.priority)}`}>
                        {getTypeIcon(rec.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{rec.title}</h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-bold border ${getPriorityColor(rec.priority)}`}>
                            {rec.priority.toUpperCase()}
                          </span>
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <span>Confidence: {Math.round(rec.confidence * 100)}%</span>
                          </div>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 mb-3">{rec.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Affected User</div>
                            <div className="font-bold text-gray-900 dark:text-white">{rec.affectedUser}</div>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Repository</div>
                            <div className="font-bold text-gray-900 dark:text-white">{rec.affectedRepository}</div>
                          </div>
                        </div>

                        {rec.suggestedPermission && (
                          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 mb-4">
                            <div className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">Suggested Action</div>
                            <div className="flex items-center space-x-2">
                              <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm font-medium">{rec.currentPermission}</span>
                              <span className="text-gray-500">→</span>
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm font-medium">{rec.suggestedPermission}</span>
                            </div>
                          </div>
                        )}

                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                          <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">AI Reasoning</div>
                          <div className="text-gray-800 dark:text-gray-200">{rec.reasoning}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {rec.actionable && (
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-600">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <span className="w-2 h-2 bg-orange-400 rounded-full mr-2"></span>
                          Risk Level: {Math.round(rec.estimatedRisk * 100)}%
                        </div>
                      </div>
                      <div className="flex space-x-3">
                        <button 
                          onClick={() => handleApplyRecommendation(rec)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                        >
                          Apply Recommendation
                        </button>
                        <button className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors font-medium">
                          Dismiss
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SmartRecommendations;
