import { useState, useEffect, useCallback } from 'react';
import githubService from '../services/githubService';
import type { GitHubRepo, GitHubUser } from '../services/githubService';
import { LoadingState, ButtonLoading, ProgressBar } from './ui/Loading';

interface RepositoryListProps {
  token: string;
  username: string;
  onLogout: () => void;
}

interface CollaboratorWithRepo extends GitHubUser {
  repositories: string[];
}

export default function RepositoryList({ token, username, onLogout }: RepositoryListProps) {
  const [repositories, setRepositories] = useState<GitHubRepo[]>([]);
  const [collaborators, setCollaborators] = useState<CollaboratorWithRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStep, setLoadingStep] = useState('Initializing...');
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPrivateOnly, setShowPrivateOnly] = useState(false);
  const [showPublicOnly, setShowPublicOnly] = useState(false);
  const [selectedCollaborators, setSelectedCollaborators] = useState<Set<string>>(new Set());
  const [removing, setRemoving] = useState(false);
  const [skipCollaborators, setSkipCollaborators] = useState(false);

  const loadCollaborators = useCallback(async (repos: GitHubRepo[]) => {
    const collaboratorMap = new Map<string, CollaboratorWithRepo>();
    let processed = 0;
    
    // Limit the number of concurrent requests to avoid rate limiting
    const BATCH_SIZE = 5;
    
    for (let i = 0; i < repos.length; i += BATCH_SIZE) {
      const batch = repos.slice(i, i + BATCH_SIZE);
      
      await Promise.all(
        batch.map(async (repo) => {
          try {
            const repoCollaborators = await githubService.getRepositoryCollaborators(
              repo.owner.login,
              repo.name
            );
            
            repoCollaborators.forEach((collaborator) => {
              if (collaborator.login !== username) { // Exclude the authenticated user
                const existingCollaborator = collaboratorMap.get(collaborator.login);
                if (existingCollaborator) {
                  existingCollaborator.repositories.push(repo.full_name);
                } else {
                  collaboratorMap.set(collaborator.login, {
                    ...collaborator,
                    repositories: [repo.full_name]
                  });
                }
              }
            });
          } catch (error) {
            console.warn(`Failed to load collaborators for ${repo.full_name}:`, error);
          }
        })
      );
      
      processed += batch.length;
      setLoadingStep(`Processing collaborators: ${processed}/${repos.length} repositories completed`);
      
      // Small delay between batches to be nice to the API
      if (i + BATCH_SIZE < repos.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log(`Found ${collaboratorMap.size} unique collaborators`);
    setCollaborators(Array.from(collaboratorMap.values()));
  }, [username]);

  const loadRepositories = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setLoadingStep('Connecting to GitHub...');
      githubService.setToken(token);
      
      setLoadingStep('Loading your repositories...');
      console.log('Loading user repositories...');
      // Get user repositories
      const userRepos = await githubService.getUserRepositories();
      console.log(`Loaded ${userRepos.length} user repositories`);
      
      setLoadingStep('Loading organizations...');
      console.log('Loading organizations...');
      // Get organizations and their repositories
      const orgs = await githubService.getUserOrganizations();
      console.log(`Found ${orgs.length} organizations`);
      
      let orgRepos: GitHubRepo[] = [];
      if (orgs.length > 0) {
        setLoadingStep('Loading organization repositories...');
        console.log('Loading organization repositories...');
        const orgRepoArrays = await Promise.all(
          orgs.map(async (org) => {
            try {
              return await githubService.getOrgRepositories(org.login);
            } catch (err) {
              console.warn(`Failed to load repos for org ${org.login}:`, err);
              return [];
            }
          })
        );
        orgRepos = orgRepoArrays.flat();
        console.log(`Loaded ${orgRepos.length} organization repositories`);
      }
      
      const allRepos = [...userRepos, ...orgRepos];
      console.log(`Total repositories: ${allRepos.length}`);
      setRepositories(allRepos);
      
      // Load collaborators for each repository (with better error handling)
      if (allRepos.length > 0 && !skipCollaborators) {
        setLoadingStep(`Loading collaborators for ${allRepos.length} repositories...`);
        console.log('Loading collaborators...');
        await loadCollaborators(allRepos);
      } else if (skipCollaborators) {
        setLoadingStep('Skipping collaborator loading...');
        setCollaborators([]);
      } else {
        setLoadingStep('No repositories found');
      }
    } catch (err) {
      console.error('Error loading repositories:', err);
      setError(err instanceof Error ? err.message : 'Failed to load repositories');
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  }, [token, loadCollaborators, skipCollaborators]);

  useEffect(() => {
    loadRepositories();
  }, [loadRepositories]);

  const handleCollaboratorToggle = (collaboratorLogin: string) => {
    const newSelected = new Set(selectedCollaborators);
    if (newSelected.has(collaboratorLogin)) {
      newSelected.delete(collaboratorLogin);
    } else {
      newSelected.add(collaboratorLogin);
    }
    setSelectedCollaborators(newSelected);
  };

  const removeSelectedCollaborators = async () => {
    if (selectedCollaborators.size === 0) return;
    
    setRemoving(true);
    const results: { success: string[]; failed: string[] } = { success: [], failed: [] };
    
    for (const collaboratorLogin of selectedCollaborators) {
      const collaborator = collaborators.find(c => c.login === collaboratorLogin);
      if (!collaborator) continue;
      
      for (const repoFullName of collaborator.repositories) {
        const [owner, repoName] = repoFullName.split('/');
        try {
          await githubService.removeCollaborator(owner, repoName, collaboratorLogin);
          results.success.push(`${collaboratorLogin} from ${repoFullName}`);
        } catch {
          results.failed.push(`${collaboratorLogin} from ${repoFullName}`);
        }
      }
    }
    
    // Show results
    if (results.success.length > 0) {
      alert(`Successfully removed:\n${results.success.join('\n')}`);
    }
    if (results.failed.length > 0) {
      alert(`Failed to remove:\n${results.failed.join('\n')}`);
    }
    
    // Reload data
    setSelectedCollaborators(new Set());
    await loadRepositories();
    setRemoving(false);
  };

  const filteredRepositories = repositories.filter(repo => {
    const matchesSearch = repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         repo.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (showPrivateOnly && !repo.private) return false;
    if (showPublicOnly && repo.private) return false;
    
    return matchesSearch;
  });

  if (loading) {
    const progressValue = loadingStep.includes('collaborators') && repositories.length > 0 
      ? Math.round((collaborators.length / repositories.length) * 100) 
      : 0;

    return (
      <div className="min-h-screen bg-gray-900 dark:bg-gray-950 flex items-center justify-center">
        <div className="max-w-md w-full px-4">
          <LoadingState 
            message={loadingStep}
            description="This may take a moment for accounts with many repositories..."
            size="lg"
          >
            {repositories.length > 0 && (
              <p className="text-sm text-green-400 mb-4">
                Found {repositories.length} repositories so far
              </p>
            )}
            
            {loadingStep.includes('collaborators') && repositories.length > 0 && (
              <div className="mb-4">
                <ProgressBar 
                  progress={progressValue}
                  message={`Loading collaborators: ${collaborators.length}/${repositories.length}`}
                  color="primary"
                />
              </div>
            )}
            
            {loadingStep.includes('collaborators') && (
              <button
                onClick={() => {
                  setSkipCollaborators(true);
                  setCollaborators([]);
                  setLoading(false);
                  setLoadingStep('');
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700"
              >
                Skip Collaborator Loading
              </button>
            )}
          </LoadingState>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-lg font-medium">{error}</div>
          <button
            onClick={onLogout}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 dark:bg-gray-950">
      <div className="bg-gray-800 dark:bg-gray-900 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-100 dark:text-white">Repository Access Manager</h1>
              <p className="text-gray-200 dark:text-gray-300 font-medium">Managing repositories for {username}</p>
            </div>
            <button
              onClick={onLogout}
              className="inline-flex items-center px-4 py-2 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div>
            <input
              type="text"
              placeholder="Search repositories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-800 text-gray-200 placeholder-gray-400"
            />
          </div>
          <div className="flex space-x-4">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={showPublicOnly}
                onChange={(e) => {
                  setShowPublicOnly(e.target.checked);
                  if (e.target.checked) setShowPrivateOnly(false);
                }}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-300">Public only</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={showPrivateOnly}
                onChange={(e) => {
                  setShowPrivateOnly(e.target.checked);
                  if (e.target.checked) setShowPublicOnly(false);
                }}
                className="rounded border-gray-600 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-300">Private only</span>
            </label>
          </div>
        </div>

        {/* Collaborators Section */}
        <div className="mb-8">
          <div className="bg-gray-800 dark:bg-gray-900 shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-200 dark:text-white">
                  Collaborators ({collaborators.length})
                </h3>
                {selectedCollaborators.size > 0 && (
                  <ButtonLoading
                    loading={removing}
                    loadingText="Removing..."
                    onClick={removeSelectedCollaborators}
                    variant="danger"
                    className="px-4 py-2 text-sm"
                  >
                    Remove Selected ({selectedCollaborators.size})
                  </ButtonLoading>
                )}
              </div>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {collaborators.map((collaborator) => (
                  <div key={collaborator.login} className="border border-gray-600 rounded-lg p-4 hover:bg-gray-700 bg-gray-800/50">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedCollaborators.has(collaborator.login)}
                        onChange={() => handleCollaboratorToggle(collaborator.login)}
                        className="rounded border-gray-600 text-red-600 shadow-sm focus:border-red-300 focus:ring focus:ring-red-200 focus:ring-opacity-50"
                      />
                      <img
                        src={collaborator.avatar_url}
                        alt={collaborator.login}
                        className="h-10 w-10 rounded-full"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-200 dark:text-white truncate">
                          {collaborator.login}
                        </p>
                        <p className="text-sm text-gray-300 dark:text-gray-400 font-medium">
                          Access to {collaborator.repositories.length} repo(s)
                        </p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="text-xs text-gray-400 dark:text-gray-500 space-y-1 font-medium">
                        {collaborator.repositories.slice(0, 3).map(repo => (
                          <div key={repo}>• {repo}</div>
                        ))}
                        {collaborator.repositories.length > 3 && (
                          <div>• ... and {collaborator.repositories.length - 3} more</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Repositories Section */}
        <div className="bg-gray-800 dark:bg-gray-900 shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-200 dark:text-white mb-4">
              Repositories ({filteredRepositories.length})
            </h3>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredRepositories.map((repo) => (
                <div key={repo.id} className="border border-gray-600 rounded-lg p-4 hover:bg-gray-700 bg-gray-800/50">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-200 dark:text-white truncate">{repo.name}</h4>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      repo.private ? 'bg-red-900/30 text-red-300 border border-red-600/50' : 'bg-green-900/30 text-green-300 border border-green-600/50'
                    }`}>
                      {repo.private ? 'Private' : 'Public'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 dark:text-gray-400 mt-1 font-medium">{repo.full_name}</p>
                  {repo.description && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 line-clamp-2 font-medium">{repo.description}</p>
                  )}
                  <a
                    href={repo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block"
                  >
                    View on GitHub →
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
