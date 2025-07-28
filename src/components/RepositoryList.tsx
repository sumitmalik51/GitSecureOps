import { useState, useEffect } from 'react';
import githubService from '../services/githubService';
import type { GitHubRepo, GitHubUser } from '../services/githubService';

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

  useEffect(() => {
    loadRepositories();
  }, [token]);

  const loadRepositories = async () => {
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
  };

  const loadCollaborators = async (repos: GitHubRepo[]) => {
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
            
            repoCollaborators.forEach(collaborator => {
              if (collaborator.login !== username) { // Exclude the authenticated user
                const existing = collaboratorMap.get(collaborator.login);
                if (existing) {
                  existing.repositories.push(repo.full_name);
                } else {
                  collaboratorMap.set(collaborator.login, {
                    ...collaborator,
                    repositories: [repo.full_name]
                  });
                }
              }
            });
            
            processed++;
            console.log(`Processed ${processed}/${repos.length} repositories`);
          } catch (err) {
            console.warn(`Failed to load collaborators for ${repo.full_name}:`, err);
            processed++;
          }
        })
      );
      
      // Small delay between batches to be respectful to the API
      if (i + BATCH_SIZE < repos.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log(`Found ${collaboratorMap.size} unique collaborators`);
    setCollaborators(Array.from(collaboratorMap.values()));
  };

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
        } catch (err) {
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
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">{loadingStep}</p>
          <p className="mt-2 text-sm text-gray-500">
            This may take a moment for accounts with many repositories...
          </p>
          {repositories.length > 0 && (
            <p className="mt-2 text-sm text-green-600">
              Found {repositories.length} repositories so far
            </p>
          )}
          {loadingStep.includes('collaborators') && (
            <button
              onClick={() => {
                setSkipCollaborators(true);
                setCollaborators([]);
                setLoading(false);
                setLoadingStep('');
              }}
              className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Skip Collaborator Loading
            </button>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg font-medium">{error}</div>
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
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Repository Access Manager</h1>
              <p className="text-gray-600">Managing repositories for {username}</p>
            </div>
            <button
              onClick={onLogout}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
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
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
              <span className="ml-2 text-sm text-gray-700">Public only</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={showPrivateOnly}
                onChange={(e) => {
                  setShowPrivateOnly(e.target.checked);
                  if (e.target.checked) setShowPublicOnly(false);
                }}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">Private only</span>
            </label>
          </div>
        </div>

        {/* Collaborators Section */}
        <div className="mb-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Collaborators ({collaborators.length})
                </h3>
                {selectedCollaborators.size > 0 && (
                  <button
                    onClick={removeSelectedCollaborators}
                    disabled={removing}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                  >
                    {removing ? 'Removing...' : `Remove Selected (${selectedCollaborators.size})`}
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {collaborators.map((collaborator) => (
                  <div key={collaborator.login} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedCollaborators.has(collaborator.login)}
                        onChange={() => handleCollaboratorToggle(collaborator.login)}
                        className="rounded border-gray-300 text-red-600 shadow-sm focus:border-red-300 focus:ring focus:ring-red-200 focus:ring-opacity-50"
                      />
                      <img
                        src={collaborator.avatar_url}
                        alt={collaborator.login}
                        className="h-10 w-10 rounded-full"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {collaborator.login}
                        </p>
                        <p className="text-sm text-gray-500">
                          Access to {collaborator.repositories.length} repo(s)
                        </p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="text-xs text-gray-500 space-y-1">
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
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Repositories ({filteredRepositories.length})
            </h3>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredRepositories.map((repo) => (
                <div key={repo.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900 truncate">{repo.name}</h4>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      repo.private ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {repo.private ? 'Private' : 'Public'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{repo.full_name}</p>
                  {repo.description && (
                    <p className="text-xs text-gray-400 mt-2 line-clamp-2">{repo.description}</p>
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
