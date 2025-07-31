// TODO: Re-enable when ready to use AI features
// import OpenAI from 'openai';

export interface AIRecommendation {
  id: string;
  type: 'stale_access' | 'permission_reduction' | 'security_risk' | 'compliance' | 'team_pattern';
  title: string;
  description: string;
  confidence: number; // 0-1
  priority: 'low' | 'medium' | 'high' | 'critical';
  affectedUser: string;
  affectedRepository: string;
  currentPermission: string;
  suggestedPermission?: string;
  reasoning: string;
  actionable: boolean;
  estimatedRisk: number; // 0-1
}

export interface RepositoryActivity {
  repository: string;
  user: string;
  lastAccess: Date;
  accessCount: number;
  permission: string;
  commits: number;
  issues: number;
  pullRequests: number;
}

export interface AccessPattern {
  user: string;
  repositories: string[];
  permissions: string[];
  team?: string;
  role?: string;
  lastActivity: Date;
}

class AzureOpenAIService {
  // TODO: Re-enable when ready to use AI features
  // private client: any = null;
  // private deploymentName: string = '';

  constructor() {
    // TODO: Re-enable when ready to use AI features
    // this.initialize();
    console.log('🚧 AI Service: Temporarily disabled - Coming Soon!');
  }

  /* TODO: Re-enable when ready to use AI features
  private initialize() {
    try {
      console.log('🔧 Initializing Azure OpenAI service...');
      const endpoint = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT;
      const apiKey = import.meta.env.VITE_AZURE_OPENAI_API_KEY;
      const deploymentName = import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT_NAME;
      const apiVersion = import.meta.env.VITE_AZURE_OPENAI_API_VERSION || '2024-04-01-preview';

      console.log('🔍 Environment check:', {
        hasEndpoint: !!endpoint,
        hasApiKey: !!apiKey,
        hasDeployment: !!deploymentName,
        endpoint: endpoint ? `${endpoint.substring(0, 20)}...` : 'missing',
        apiKey: apiKey ? `${apiKey.substring(0, 10)}...` : 'missing',
        deploymentName: deploymentName || 'missing'
      });

      if (!endpoint || !apiKey || !deploymentName) {
        console.warn('Azure OpenAI configuration missing. Smart recommendations disabled.');
        console.log('Available env vars:', {
          endpoint: !!endpoint,
          apiKey: !!apiKey,
          deploymentName: !!deploymentName
        });
        return;
      }

      // Note: dangerouslyAllowBrowser is enabled for demo purposes
      // In production, Azure OpenAI calls should be made from a backend API
      this.client = new OpenAI({
        apiKey: apiKey,
        baseURL: `${endpoint}/openai/deployments/${deploymentName}`,
        defaultQuery: { 'api-version': apiVersion },
        defaultHeaders: {
          'api-key': apiKey,
        },
        dangerouslyAllowBrowser: true,
      });
      
      this.deploymentName = deploymentName;
      
      console.log('✅ Azure OpenAI service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Azure OpenAI service:', error);
    }
  }
  */

  async generateAccessRecommendations(
    // TODO: Re-enable these parameters when AI features are ready
    // activities: RepositoryActivity[],
    // patterns: AccessPattern[]
  ): Promise<AIRecommendation[]> {
    // TODO: Re-enable when ready to use AI features
    console.log('🚧 AI Service: Using mock data - Real AI coming soon!');
    return this.getMockRecommendations();

    /* TODO: Re-enable when ready to use AI features
    if (!this.client) {
      console.warn('Azure OpenAI not configured. Returning mock recommendations.');
      return this.getMockRecommendations();
    }

    try {
      const prompt = this.buildAnalysisPrompt(activities, patterns);
      
      const response = await this.client.chat.completions.create({
        model: this.deploymentName, // For Azure OpenAI, this is the deployment name
        messages: [
          {
            role: 'system',
            content: `You are a GitHub access management expert. Analyze repository access patterns and provide actionable security recommendations. 
            
            Focus on:
            1. Stale access (users who haven't used repositories recently)
            2. Over-privileged access (users with more permissions than needed)
            3. Security risks (unusual access patterns)
            4. Compliance issues (access that violates best practices)
            5. Team optimization (suggest access based on team patterns)
            
            Return recommendations as JSON array with the specified structure.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.3
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from Azure OpenAI');
      }

      return this.parseRecommendations(content);
    } catch (error) {
      console.error('Error generating AI recommendations:', error);
      return this.getMockRecommendations();
    }
    */
  }

  /* TODO: Re-enable when ready to use AI features
  private buildAnalysisPrompt(activities: RepositoryActivity[], patterns: AccessPattern[]): string {
    const activitiesData = activities.map(a => ({
      repo: a.repository,
      user: a.user,
      lastAccess: a.lastAccess.toISOString().split('T')[0],
      daysSinceAccess: Math.floor((Date.now() - a.lastAccess.getTime()) / (1000 * 60 * 60 * 24)),
      permission: a.permission,
      commits: a.commits,
      usage: a.accessCount
    }));

    const patternsData = patterns.map(p => ({
      user: p.user,
      repoCount: p.repositories.length,
      permissions: p.permissions,
      team: p.team,
      daysSinceActivity: Math.floor((Date.now() - p.lastActivity.getTime()) / (1000 * 60 * 60 * 24))
    }));

    return `Analyze this GitHub access data and provide security recommendations:

REPOSITORY ACCESS ACTIVITIES:
${JSON.stringify(activitiesData, null, 2)}

USER ACCESS PATTERNS:
${JSON.stringify(patternsData, null, 2)}

Please identify:
1. Users with stale access (>90 days no activity) - HIGH priority
2. Over-privileged users (admin/write access but low usage) - MEDIUM priority  
3. Unusual patterns that might indicate security risks - CRITICAL priority
4. Users who should have similar access to teammates - LOW priority

Return as JSON array with this exact structure:
[
  {
    "id": "unique-id",
    "type": "stale_access|permission_reduction|security_risk|compliance|team_pattern",
    "title": "Short title",
    "description": "Detailed description", 
    "confidence": 0.85,
    "priority": "high",
    "affectedUser": "username",
    "affectedRepository": "repo-name",
    "currentPermission": "admin",
    "suggestedPermission": "read",
    "reasoning": "Explanation of why this recommendation is made",
    "actionable": true,
    "estimatedRisk": 0.7
  }
]`;
  }
  */

  /* TODO: Re-enable when ready to use AI features
  private parseRecommendations(content: string): AIRecommendation[] {
    try {
      // Extract JSON from the response (handle potential markdown formatting)
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }

      const recommendations = JSON.parse(jsonMatch[0]);
      
      // Validate and sanitize the recommendations
      return recommendations.map((rec: any, index: number) => ({
        id: rec.id || `ai-rec-${Date.now()}-${index}`,
        type: rec.type || 'compliance',
        title: rec.title || 'Access Review Needed',
        description: rec.description || 'Please review this access pattern',
        confidence: Math.min(1, Math.max(0, rec.confidence || 0.5)),
        priority: ['low', 'medium', 'high', 'critical'].includes(rec.priority) ? rec.priority : 'medium',
        affectedUser: rec.affectedUser || 'unknown',
        affectedRepository: rec.affectedRepository || 'unknown',
        currentPermission: rec.currentPermission || 'unknown',
        suggestedPermission: rec.suggestedPermission,
        reasoning: rec.reasoning || 'AI analysis suggests reviewing this access',
        actionable: rec.actionable !== false,
        estimatedRisk: Math.min(1, Math.max(0, rec.estimatedRisk || 0.3))
      }));
    } catch (error) {
      console.error('Error parsing AI recommendations:', error);
      return this.getMockRecommendations();
    }
  }
  */

  private getMockRecommendations(): AIRecommendation[] {
    return [
      {
        id: 'mock-1',
        type: 'stale_access',
        title: 'Stale Access Detected',
        description: 'User has not accessed this repository in 120 days',
        confidence: 0.9,
        priority: 'high',
        affectedUser: 'john.doe',
        affectedRepository: 'legacy-project',
        currentPermission: 'admin',
        suggestedPermission: 'none',
        reasoning: 'No activity detected for 4 months. Consider removing access.',
        actionable: true,
        estimatedRisk: 0.7
      },
      {
        id: 'mock-2',
        type: 'permission_reduction',
        title: 'Over-privileged Access',
        description: 'User has admin access but only performs read operations',
        confidence: 0.8,
        priority: 'medium',
        affectedUser: 'jane.smith',
        affectedRepository: 'frontend-app',
        currentPermission: 'admin',
        suggestedPermission: 'read',
        reasoning: 'Usage patterns indicate read-only access would be sufficient.',
        actionable: true,
        estimatedRisk: 0.5
      }
    ];
  }

  async analyzeSecurityRisks(activities: RepositoryActivity[]): Promise<{
    riskScore: number;
    risks: string[];
    recommendations: string[];
  }> {
    // Analyze patterns for security risks
    const staleAccess = activities.filter(a => 
      (Date.now() - a.lastAccess.getTime()) > (90 * 24 * 60 * 60 * 1000)
    );
    
    const overPrivileged = activities.filter(a => 
      a.permission === 'admin' && a.commits === 0 && a.pullRequests === 0
    );

    const riskScore = Math.min(1, (staleAccess.length * 0.3 + overPrivileged.length * 0.5) / activities.length);
    
    const risks: string[] = [];
    const recommendations: string[] = [];

    if (staleAccess.length > 0) {
      risks.push(`${staleAccess.length} users with stale access (>90 days)`);
      recommendations.push('Review and remove inactive user access');
    }

    if (overPrivileged.length > 0) {
      risks.push(`${overPrivileged.length} users with excessive permissions`);
      recommendations.push('Reduce permissions to minimum required level');
    }

    return { riskScore, risks, recommendations };
  }

  isConfigured(): boolean {
    // TODO: Re-enable when ready to use AI features
    return false; // Always return false to show "Coming Soon" mode
    // return this.client !== null;
  }
}

export const aiService = new AzureOpenAIService();
export default aiService;
