import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  Users, 
  Search, 
  CheckCircle, 
  ArrowLeft,
  Filter,
  RefreshCw,
  FileDown,
  Database,
  X,
  Plus
} from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';
import githubService, { type GitHubOrg } from '../services/githubService';
import { useToast } from '../hooks/useToast';

interface ExportUserDataProps {
  token: string;
  onBack: () => void;
}

interface UserData {
  username: string;
  repositories: string[];
  permissions: { [repo: string]: string };
  organizations: string[];
}

interface OrgSelection {
  login: string;
  selected: boolean;
}

export default function ExportUserData({ token, onBack }: ExportUserDataProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [targetUsernames, setTargetUsernames] = useState<string[]>(['']);
  const [organizations, setOrganizations] = useState<GitHubOrg[]>([]);
  const [orgSelections, setOrgSelections] = useState<OrgSelection[]>([]);
  const [selectedScope, setSelectedScope] = useState<'user' | 'org' | 'selected' | 'all'>('user');
  const [userData, setUserData] = useState<UserData[]>([]);
  const [filteredData, setFilteredData] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOrgSelector, setShowOrgSelector] = useState(false);
  const [showUserInput, setShowUserInput] = useState(false);

  // Load organizations on component mount
  useEffect(() => {
    const loadOrganizations = async () => {
      try {
        githubService.setToken(token);
        const orgs = await githubService.getUserOrganizations();
        setOrganizations(orgs);
        setOrgSelections(orgs.map(org => ({ login: org.login, selected: false })));
      } catch (error) {
        console.warn('Failed to load organizations:', error);
      }
    };
    loadOrganizations();
  }, [token]);

  // Filter data based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredData(userData);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = userData.filter(user => 
        user.username.toLowerCase().includes(query) ||
        user.repositories.some(repo => repo.toLowerCase().includes(query)) ||
        user.organizations.some(org => org.toLowerCase().includes(query))
      );
      setFilteredData(filtered);
    }
  }, [searchQuery, userData]);

  const addUsername = () => {
    setTargetUsernames([...targetUsernames, '']);
  };

  const removeUsername = (index: number) => {
    if (targetUsernames.length > 1) {
      setTargetUsernames(targetUsernames.filter((_, i) => i !== index));
    }
  };

  const updateUsername = (index: number, value: string) => {
    const newUsernames = [...targetUsernames];
    newUsernames[index] = value;
    setTargetUsernames(newUsernames);
  };

  const toggleOrgSelection = (orgLogin: string) => {
    setOrgSelections(prev => 
      prev.map(org => 
        org.login === orgLogin 
          ? { ...org, selected: !org.selected }
          : org
      )
    );
  };

  const loadUserData = async () => {
    setIsLoading(true);
    setError('');
    setUserData([]);

    try {
      githubService.setToken(token);
      const userMap = new Map<string, UserData>();

      let repos: any[] = [];

      // Get repositories based on selected scope
      if (selectedScope === 'user') {
        repos = await githubService.getUserRepositories();
      } else if (selectedScope === 'selected') {
        const selectedOrgs = orgSelections.filter(org => org.selected);
        const orgRepos = await Promise.all(
          selectedOrgs.map(async (orgSelection) => {
            try {
              const orgRepos = await githubService.getOrgRepositories(orgSelection.login);
              return orgRepos.map(repo => ({ ...repo, orgName: orgSelection.login }));
            } catch (error) {
              console.warn(`Failed to load repos for ${orgSelection.login}:`, error);
              return [];
            }
          })
        );
        repos = orgRepos.flat();
      } else if (selectedScope === 'all') {
        // Load all repositories from user and organizations
        const userRepos = await githubService.getUserRepositories();
        const orgRepos = await Promise.all(
          organizations.map(async (org) => {
            try {
              const orgRepoList = await githubService.getOrgRepositories(org.login);
              return orgRepoList.map(repo => ({ ...repo, orgName: org.login }));
            } catch (error) {
              console.warn(`Failed to load repos for ${org.login}:`, error);
              return [];
            }
          })
        );
        repos = [...userRepos, ...orgRepos.flat()];
      }

      // If specific usernames are provided, filter for those users
      const validUsernames = targetUsernames.filter(u => u.trim() !== '');
      const searchSpecificUsers = validUsernames.length > 0 && showUserInput;

      // Process repositories to collect user data
      for (const repo of repos) {
        try {
          const collaborators = await githubService.getRepositoryCollaborators(
            repo.owner.login,
            repo.name
          );

          for (const collab of collaborators) {
            // If searching for specific users, skip others
            if (searchSpecificUsers && !validUsernames.some(u => u.toLowerCase() === collab.login.toLowerCase())) {
              continue;
            }

            const permission = await githubService.getUserPermissionForRepo(
              repo.owner.login,
              repo.name,
              collab.login
            );

            const existingUser = userMap.get(collab.login);
            if (existingUser) {
              existingUser.repositories.push(repo.full_name);
              existingUser.permissions[repo.full_name] = permission.permission;
              if (repo.orgName && !existingUser.organizations.includes(repo.orgName)) {
                existingUser.organizations.push(repo.orgName);
              }
            } else {
              const newUser: UserData = {
                username: collab.login,
                repositories: [repo.full_name],
                permissions: { [repo.full_name]: permission.permission },
                organizations: repo.orgName ? [repo.orgName] : []
              };
              userMap.set(collab.login, newUser);
            }
          }
        } catch (repoError) {
          console.warn(`Failed to process ${repo.full_name}:`, repoError);
        }
      }

      const usersArray = Array.from(userMap.values());
      setUserData(usersArray);

      if (usersArray.length === 0) {
        setError('No user data found in the selected scope');
        toast.warning('No Data Found', 'No user data found in the selected repositories.');
      } else {
        toast.success('Data Loaded', `Found data for ${usersArray.length} users.`);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load user data';
      setError(errorMessage);
      toast.error('Load Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const exportToCSV = (detailed = true) => {
    if (filteredData.length === 0) {
      toast.warning('No Data', 'No data to export.');
      return;
    }

    let csvContent: string;
    let filename: string;

    if (detailed) {
      // Export detailed data with repositories and permissions
      const headers = ['Username', 'Total Repositories', 'Organizations', 'Repositories', 'Permissions'];
      const rows = filteredData.map(user => [
        user.username,
        user.repositories.length.toString(),
        user.organizations.join('; '),
        user.repositories.join('; '),
        user.repositories.map(repo => `${repo}: ${user.permissions[repo]}`).join('; ')
      ]);
      
      csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${field.replace(/"/g, '""')}"`).join(','))
        .join('\n');
      
      filename = `github-user-data-detailed-${new Date().toISOString().split('T')[0]}.csv`;
    } else {
      // Export just usernames
      const headers = ['Username'];
      const rows = filteredData.map(user => [user.username]);
      
      csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');
      
      filename = `github-usernames-${new Date().toISOString().split('T')[0]}.csv`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Export Complete', `Successfully exported ${filteredData.length} user records.`);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
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
            
            <Download className="w-10 h-10 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Export User Data
            </h1>
          </div>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Export comprehensive user data from your repositories and organizations
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
                Export Scope
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
                  <Database className="w-4 h-4" />
                  Selected Organizations ({orgSelections.filter(org => org.selected).length})
                </Button>
                
                <Button
                  variant={selectedScope === 'all' ? 'primary' : 'secondary'}
                  onClick={() => setSelectedScope('all')}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  All Accessible Data
                </Button>
              </div>

              {/* Organization Selector */}
              <AnimatePresence>
                {showOrgSelector && selectedScope === 'selected' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-gray-700 pt-6 mb-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">Select Organizations</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowOrgSelector(false)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                      {organizations.map((org) => {
                        const selection = orgSelections.find(s => s.login === org.login);
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
                              <div className={`w-4 h-4 rounded border ${
                                selection?.selected ? 'bg-primary border-primary' : 'border-gray-500'
                              } flex items-center justify-center`}>
                                {selection?.selected && <CheckCircle className="w-3 h-3 text-white" />}
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

              {/* User Filter Option */}
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-white">
                  <input
                    type="checkbox"
                    checked={showUserInput}
                    onChange={(e) => setShowUserInput(e.target.checked)}
                    className="rounded border-gray-600 text-primary focus:ring-primary"
                  />
                  Filter by specific users
                </label>
              </div>

              {/* User Input */}
              <AnimatePresence>
                {showUserInput && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-gray-700 pt-6 mt-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">Target Users</h3>
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

                    <div className="space-y-3">
                      {targetUsernames.map((username, index) => (
                        <div key={index} className="flex gap-3 items-center">
                          <div className="flex-1">
                            <input
                              type="text"
                              value={username}
                              onChange={(e) => updateUsername(index, e.target.value)}
                              placeholder={`GitHub username ${index + 1}...`}
                              className="w-full px-4 py-2 bg-gray-800/50 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:border-primary focus:outline-none focus:bg-gray-700/50"
                            />
                          </div>
                          {targetUsernames.length > 1 && (
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
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex justify-end mt-6">
                <Button
                  onClick={loadUserData}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      Load User Data
                    </>
                  )}
                </Button>
              </div>
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
                    <X className="w-5 h-5" />
                    <span>{error}</span>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results */}
          <AnimatePresence>
            {userData.length > 0 && (
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
                      User Data ({filteredData.length} users)
                    </h2>
                    
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Filter users..."
                          className="pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:border-primary focus:outline-none focus:bg-gray-700/50"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Export Buttons */}
                  <div className="flex gap-4 mb-6">
                    <Button
                      onClick={() => exportToCSV(true)}
                      className="flex items-center gap-2"
                    >
                      <FileDown className="w-4 h-4" />
                      Export Detailed CSV ({filteredData.length} users)
                    </Button>
                    
                    <Button
                      onClick={() => exportToCSV(false)}
                      variant="secondary"
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Export Usernames Only
                    </Button>
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card className="p-4 bg-blue-900/20 border-blue-500/50">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-300">{filteredData.length}</div>
                        <div className="text-blue-400">Total Users</div>
                      </div>
                    </Card>
                    
                    <Card className="p-4 bg-green-900/20 border-green-500/50">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-300">
                          {filteredData.reduce((total, user) => total + user.repositories.length, 0)}
                        </div>
                        <div className="text-green-400">Total Repository Access</div>
                      </div>
                    </Card>
                    
                    <Card className="p-4 bg-purple-900/20 border-purple-500/50">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-300">
                          {Math.round(filteredData.reduce((total, user) => total + user.repositories.length, 0) / filteredData.length * 10) / 10}
                        </div>
                        <div className="text-purple-400">Avg Repos per User</div>
                      </div>
                    </Card>
                  </div>

                  {/* User List */}
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filteredData.map((user, index) => (
                      <div
                        key={user.username}
                        className="p-4 bg-dark-secondary rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold text-sm">
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-semibold text-white">{user.username}</div>
                              <div className="text-sm text-gray-400">
                                {user.repositories.length} repositories
                                {user.organizations.length > 0 && ` • ${user.organizations.join(', ')}`}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-500">
                              {user.repositories.slice(0, 3).join(', ')}
                              {user.repositories.length > 3 && ` +${user.repositories.length - 3} more`}
                            </div>
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
