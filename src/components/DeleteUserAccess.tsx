import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Users,
  Search,
  Trash2,
  AlertTriangle,
  CheckCircle,
  X,
  Plus,
  ArrowLeft,
  Filter,
  RefreshCw,
} from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';
import githubService, { type GitHubOrg } from '../services/githubService';
import { useToast } from '../hooks/useToast';

interface DeleteUserAccessProps {
  token: string;
  onBack: () => void;
}

interface UserAccess {
  username: string;
  repository: string;
  permission: string;
  organization?: string;
}

interface OrgSelection {
  login: string;
  selected: boolean;
}

export default function DeleteUserAccess({ token, onBack }: DeleteUserAccessProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [usernames, setUsernames] = useState<string[]>(['']);
  const [organizations, setOrganizations] = useState<GitHubOrg[]>([]);
  const [orgSelections, setOrgSelections] = useState<OrgSelection[]>([]);
  const [selectedScope, setSelectedScope] = useState<'user' | 'org' | 'selected'>('user');
  const [userAccess, setUserAccess] = useState<UserAccess[]>([]);
  const [filteredAccess, setFilteredAccess] = useState<UserAccess[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState('');
  const [showOrgSelector, setShowOrgSelector] = useState(false);

  // Progress tracking
  const [progress, setProgress] = useState({
    current: 0,
    total: 0,
    currentRepo: '',
    phase: '' as '' | 'fetching-repos' | 'scanning' | 'done',
  });

  // Load organizations on component mount
  useEffect(() => {
    const loadOrganizations = async () => {
      try {
        githubService.setToken(token);
        const orgs = await githubService.getUserOrganizations();
        setOrganizations(orgs);
        setOrgSelections(orgs.map((org) => ({ login: org.login, selected: false })));
      } catch (error) {
        console.warn('Failed to load organizations:', error);
      }
    };
    loadOrganizations();
  }, [token]);

  // Filter access based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredAccess(userAccess);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = userAccess.filter(
        (access) =>
          access.username.toLowerCase().includes(query) ||
          access.repository.toLowerCase().includes(query) ||
          (access.organization && access.organization.toLowerCase().includes(query))
      );
      setFilteredAccess(filtered);
    }
  }, [searchQuery, userAccess]);

  const addUsername = () => {
    setUsernames([...usernames, '']);
  };

  const removeUsername = (index: number) => {
    if (usernames.length > 1) {
      setUsernames(usernames.filter((_, i) => i !== index));
    }
  };

  const updateUsername = (index: number, value: string) => {
    const newUsernames = [...usernames];
    newUsernames[index] = value;
    setUsernames(newUsernames);
  };

  const toggleOrgSelection = (orgLogin: string) => {
    setOrgSelections((prev) =>
      prev.map((org) => (org.login === orgLogin ? { ...org, selected: !org.selected } : org))
    );
  };

  const searchUserAccess = async () => {
    const validUsernames = usernames.filter((u) => u.trim() !== '');
    if (validUsernames.length === 0) {
      setError('Please enter at least one username');
      return;
    }

    setIsSearching(true);
    setError('');
    setUserAccess([]);
    setProgress({ current: 0, total: 0, currentRepo: '', phase: 'fetching-repos' });

    try {
      githubService.setToken(token);
      const allAccess: UserAccess[] = [];

      if (selectedScope === 'user') {
        // Fetch repos first to know total count
        setProgress((p) => ({ ...p, phase: 'fetching-repos' }));
        const repos = await githubService.getUserRepositories();
        setProgress({ current: 0, total: repos.length, currentRepo: '', phase: 'scanning' });

        for (let i = 0; i < repos.length; i++) {
          const repo = repos[i];
          setProgress((p) => ({ ...p, current: i + 1, currentRepo: repo.full_name }));
          try {
            const collaborators = await githubService.getRepositoryCollaborators(
              repo.owner.login,
              repo.name
            );

            for (const collab of collaborators) {
              if (validUsernames.some((u) => u.toLowerCase() === collab.login.toLowerCase())) {
                const permission = await githubService.getUserPermissionForRepo(
                  repo.owner.login,
                  repo.name,
                  collab.login
                );

                allAccess.push({
                  username: collab.login,
                  repository: repo.full_name,
                  permission: permission.permission,
                });
              }
            }
          } catch (repoError) {
            console.warn(`Failed to check ${repo.full_name}:`, repoError);
          }
        }
      } else if (selectedScope === 'selected') {
        // Fetch all org repos first to get total count
        const selectedOrgs = orgSelections.filter((org) => org.selected);
        setProgress((p) => ({ ...p, phase: 'fetching-repos' }));

        const orgRepoMap: {
          org: string;
          repos: Awaited<ReturnType<typeof githubService.getOrgRepositories>>;
        }[] = [];
        let totalRepos = 0;
        for (const orgSelection of selectedOrgs) {
          try {
            const repos = await githubService.getOrgRepositories(orgSelection.login);
            orgRepoMap.push({ org: orgSelection.login, repos });
            totalRepos += repos.length;
          } catch (orgError) {
            console.warn(`Failed to fetch repos for org ${orgSelection.login}:`, orgError);
          }
        }

        let processed = 0;
        setProgress({ current: 0, total: totalRepos, currentRepo: '', phase: 'scanning' });

        for (const { org, repos } of orgRepoMap) {
          for (const repo of repos) {
            processed++;
            setProgress((p) => ({ ...p, current: processed, currentRepo: repo.full_name }));
            try {
              const collaborators = await githubService.getRepositoryCollaborators(
                repo.owner.login,
                repo.name
              );

              for (const collab of collaborators) {
                if (validUsernames.some((u) => u.toLowerCase() === collab.login.toLowerCase())) {
                  const permission = await githubService.getUserPermissionForRepo(
                    repo.owner.login,
                    repo.name,
                    collab.login
                  );

                  allAccess.push({
                    username: collab.login,
                    repository: repo.full_name,
                    permission: permission.permission,
                    organization: org,
                  });
                }
              }
            } catch (repoError) {
              console.warn(`Failed to check ${repo.full_name}:`, repoError);
            }
          }
        }
      }

      setProgress((p) => ({ ...p, phase: 'done' }));

      setUserAccess(allAccess);

      if (allAccess.length === 0) {
        setError(`No access found for users: ${validUsernames.join(', ')}`);
        toast.warning('No Access Found', `No repository access found for the specified users.`);
      } else {
        toast.success('Search Complete', `Found ${allAccess.length} access entries.`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to search user access';
      setError(errorMessage);
      toast.error('Search Failed', errorMessage);
    } finally {
      setIsSearching(false);
      // Keep progress visible briefly then clear
      setTimeout(() => setProgress({ current: 0, total: 0, currentRepo: '', phase: '' }), 3000);
    }
  };

  const removeUserAccess = async () => {
    if (filteredAccess.length === 0) return;

    setIsRemoving(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const access of filteredAccess) {
        try {
          const [owner, repoName] = access.repository.split('/');
          await githubService.removeCollaborator(owner, repoName, access.username);
          successCount++;
        } catch (error) {
          console.error(`Failed to remove ${access.username} from ${access.repository}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(
          'Removal Complete',
          `Successfully removed access from ${successCount} repositories.`
        );
        setUserAccess((prev) => prev.filter((access) => !filteredAccess.includes(access)));
      }

      if (errorCount > 0) {
        toast.warning(
          'Partial Success',
          `${errorCount} removals failed. Check console for details.`
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove user access';
      toast.error('Removal Failed', errorMessage);
    } finally {
      setIsRemoving(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-primary via-dark-secondary to-dark-accent">
      <div className="p-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8 relative"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Button
              variant="ghost"
              onClick={onBack}
              className="absolute left-0 top-0 flex items-center gap-2 text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>

            <Trash2 className="w-10 h-10 text-red-500" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">
              Delete User Access
            </h1>
          </div>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Remove specific users' access from repositories across your account and organizations
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Scope Selection */}
          <motion.div variants={itemVariants}>
            <Card className="p-6">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Filter className="w-6 h-6 text-primary" />
                Search Scope
              </h2>

              <div className="flex flex-wrap gap-4 mb-6">
                <Button
                  variant={selectedScope === 'user' ? 'primary' : 'secondary'}
                  onClick={() => setSelectedScope('user')}
                  className="flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  My Repositories
                </Button>

                <Button
                  variant={selectedScope === 'selected' ? 'primary' : 'secondary'}
                  onClick={() => {
                    setSelectedScope('selected');
                    setShowOrgSelector(true);
                  }}
                  className="flex items-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  Selected Organizations ({orgSelections.filter((org) => org.selected).length})
                </Button>
              </div>

              {/* Organization Selector */}
              <AnimatePresence>
                {showOrgSelector && selectedScope === 'selected' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-gray-700 pt-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">Select Organizations</h3>
                      <Button variant="ghost" size="sm" onClick={() => setShowOrgSelector(false)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                      {organizations.map((org) => {
                        const selection = orgSelections.find((s) => s.login === org.login);
                        return (
                          <div
                            key={org.login}
                            className={`p-3 rounded-lg border cursor-pointer transition-all ${
                              selection?.selected
                                ? 'bg-primary/20 border-primary text-primary'
                                : 'bg-dark-card border-gray-700 text-gray-300 hover:border-gray-600'
                            }`}
                            onClick={() => toggleOrgSelection(org.login)}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-4 h-4 rounded border ${
                                  selection?.selected
                                    ? 'bg-primary border-primary'
                                    : 'border-gray-500'
                                } flex items-center justify-center`}
                              >
                                {selection?.selected && (
                                  <CheckCircle className="w-3 h-3 text-white" />
                                )}
                              </div>
                              <span className="font-medium">{org.login}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>

          {/* User Input */}
          <motion.div variants={itemVariants}>
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Users className="w-6 h-6 text-primary" />
                  Target Users
                </h2>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={addUsername}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add User
                </Button>
              </div>

              <div className="space-y-4">
                {usernames.map((username, index) => (
                  <div key={index} className="flex gap-3 items-center">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => updateUsername(index, e.target.value)}
                        placeholder={`GitHub username ${index + 1}...`}
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:border-primary focus:outline-none focus:bg-gray-700/50"
                      />
                    </div>
                    {usernames.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeUsername(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end mt-6">
                <Button
                  onClick={searchUserAccess}
                  disabled={isSearching || usernames.every((u) => u.trim() === '')}
                  className="flex items-center gap-2"
                >
                  {isSearching ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      Search Access ({usernames.filter((u) => u.trim() !== '').length} users)
                    </>
                  )}
                </Button>
              </div>

              {/* Progress Bar */}
              <AnimatePresence>
                {isSearching && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6 space-y-3"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">
                        {progress.phase === 'fetching-repos' && (
                          <span className="flex items-center gap-2">
                            <RefreshCw className="w-3 h-3 animate-spin text-primary" />
                            Fetching repository list...
                          </span>
                        )}
                        {progress.phase === 'scanning' && progress.total > 0 && (
                          <span className="flex items-center gap-2">
                            <Search className="w-3 h-3 text-primary" />
                            Scanning:{' '}
                            <span className="text-white font-mono truncate max-w-xs inline-block align-bottom">
                              {progress.currentRepo}
                            </span>
                          </span>
                        )}
                      </span>
                      <span className="text-gray-300 font-mono">
                        {progress.phase === 'scanning' && progress.total > 0
                          ? `${progress.current} / ${progress.total} repos`
                          : ''}
                      </span>
                    </div>

                    <div className="relative w-full h-3 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                      {progress.phase === 'fetching-repos' ? (
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-primary/60 via-primary to-primary/60"
                          animate={{ x: ['-100%', '100%'] }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                          style={{ width: '50%' }}
                        />
                      ) : (
                        <motion.div
                          className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full"
                          initial={{ width: 0 }}
                          animate={{
                            width:
                              progress.total > 0
                                ? `${(progress.current / progress.total) * 100}%`
                                : '0%',
                          }}
                          transition={{ duration: 0.3, ease: 'easeOut' }}
                        />
                      )}
                    </div>

                    {progress.phase === 'scanning' && progress.total > 0 && (
                      <div className="text-right text-xs text-gray-500">
                        {Math.round((progress.current / progress.total) * 100)}% complete
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>

          {/* Error Display */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                variants={itemVariants}
              >
                <Card className="p-4 bg-red-900/20 border-red-500/50">
                  <div className="flex items-center gap-3 text-red-300">
                    <AlertTriangle className="w-5 h-5" />
                    <span>{error}</span>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search Results */}
          <AnimatePresence>
            {userAccess.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                variants={itemVariants}
              >
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-green-500" />
                      Found Access ({filteredAccess.length} entries)
                    </h2>

                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Filter results..."
                          className="pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:border-primary focus:outline-none focus:bg-gray-700/50"
                        />
                      </div>

                      <Button
                        onClick={removeUserAccess}
                        disabled={isRemoving || filteredAccess.length === 0}
                        variant="outline"
                        className="flex items-center gap-2 text-red-400 border-red-500 hover:bg-red-500 hover:text-white"
                      >
                        {isRemoving ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Removing...
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4" />
                            Remove All ({filteredAccess.length})
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filteredAccess.map((access, index) => (
                      <div
                        key={`${access.username}-${access.repository}`}
                        className="p-4 bg-dark-secondary rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold text-sm">
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-semibold text-white">{access.username}</div>
                              <div className="text-sm text-gray-400">{access.repository}</div>
                              {access.organization && (
                                <div className="text-xs text-gray-500">
                                  Org: {access.organization}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                access.permission === 'admin'
                                  ? 'bg-red-900/50 text-red-300 border border-red-500/50'
                                  : access.permission === 'write'
                                    ? 'bg-yellow-900/50 text-yellow-300 border border-yellow-500/50'
                                    : 'bg-blue-900/50 text-blue-300 border border-blue-500/50'
                              }`}
                            >
                              {access.permission.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
