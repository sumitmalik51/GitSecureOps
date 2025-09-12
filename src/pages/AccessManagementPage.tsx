import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  UserX, 
  Download, 
  ArrowLeft, 
  Users,
  FileDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import DeleteUserAccess from '../components/DeleteUserAccess';
import ExportUserData from '../components/ExportUserData';

type ViewMode = 'menu' | 'delete-access' | 'export-data';

export default function AccessManagementPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [currentView, setCurrentView] = useState<ViewMode>('menu');

  if (!token) {
    navigate('/login');
    return null;
  }

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

  const features = [
    {
      id: 'delete-access',
      title: 'Delete User Access',
      description: 'Remove specific users\' access from repositories across your account and organizations',
      icon: UserX,
      color: 'from-red-500 to-pink-500',
      bgColor: 'from-red-500/20 to-pink-500/20',
      action: () => setCurrentView('delete-access')
    },
    {
      id: 'export-data',
      title: 'Export User Data',
      description: 'Export comprehensive user data including repository access and permissions',
      icon: FileDown,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'from-blue-500/20 to-cyan-500/20',
      action: () => setCurrentView('export-data')
    }
  ];

  if (currentView === 'delete-access') {
    return (
      <DeleteUserAccess
        token={token}
        onBack={() => setCurrentView('menu')}
      />
    );
  }

  if (currentView === 'export-data') {
    return (
      <ExportUserData
        token={token}
        onBack={() => setCurrentView('menu')}
      />
    );
  }

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
              onClick={() => navigate('/dashboard')}
              className="absolute left-0 top-0 flex items-center gap-2 text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
            
            <Shield className="w-10 h-10 text-brand-primary" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-brand-primary to-brand-accent bg-clip-text text-transparent">
              Access Management
            </h1>
          </div>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Advanced tools for managing user access and data across your GitHub repositories and organizations
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          {features.map((feature) => (
            <motion.div key={feature.id} variants={itemVariants}>
              <Card className="group relative overflow-hidden hover:scale-[1.02] transition-all duration-300 cursor-pointer container-hover">
                {/* Background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                
                <div className="relative p-8 h-full container-content" onClick={feature.action}>
                  <div className="flex flex-col h-full">
                    {/* Icon and Title */}
                    <div className="mb-6">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 no-blur-hover`}>
                        <feature.icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-brand-primary transition-colors duration-300 card-text">
                        {feature.title}
                      </h3>
                      <p className="text-gray-300 leading-relaxed card-text">
                        {feature.description}
                      </p>
                    </div>

                    {/* Action Button */}
                    <div className="mt-auto">
                      <Button
                        variant="primary"
                        className="w-full group-hover:scale-105 transition-transform duration-300"
                      >
                        Get Started
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Additional Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12"
        >
          <Card className="p-8">
            <div className="text-center mb-8">
              <Users className="w-12 h-12 text-brand-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-4">Powerful Access Management</h2>
              <p className="text-gray-300 max-w-2xl mx-auto leading-relaxed">
                Take control of your GitHub repositories and organizations with advanced user management tools.
                Search, filter, and manage access with precision and ease.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Secure Operations</h3>
                <p className="text-gray-400 text-sm">
                  All operations are performed securely using your GitHub token with proper permissions
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Multi-Organization</h3>
                <p className="text-gray-400 text-sm">
                  Manage access across multiple organizations and repositories in a single interface
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Download className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Export & Audit</h3>
                <p className="text-gray-400 text-sm">
                  Export user data and access information for compliance and audit purposes
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
