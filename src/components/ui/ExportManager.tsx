import { useState } from 'react';
import { Download, FileText, Table, Code } from 'lucide-react';
import { ButtonLoading } from './Loading';

interface ExportData {
  repositories?: any[];
  collaborators?: any[];
  auditLog?: any[];
  metadata?: {
    exportDate: string;
    totalRepositories?: number;
    totalCollaborators?: number;
    username?: string;
  };
}

interface ExportManagerProps {
  data: ExportData;
  filename?: string;
  className?: string;
}

type ExportFormat = 'csv' | 'json' | 'txt';

export function ExportManager({ data, filename = 'github-audit', className = '' }: ExportManagerProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  };

  const downloadFile = (content: string, fileName: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportAsCSV = () => {
    let csvContent = '';
    
    if (data.repositories && data.repositories.length > 0) {
      // Repository data
      csvContent += 'REPOSITORIES\n';
      csvContent += 'Name,Full Name,Description,Language,Stars,Forks,Private,Last Updated,URL\n';
      
      data.repositories.forEach(repo => {
        const row = [
          `"${repo.name || ''}"`,
          `"${repo.full_name || ''}"`,
          `"${(repo.description || '').replace(/"/g, '""')}"`,
          `"${repo.language || 'N/A'}"`,
          repo.stargazers_count || 0,
          repo.forks_count || 0,
          repo.private ? 'Yes' : 'No',
          repo.updated_at ? new Date(repo.updated_at).toLocaleDateString() : 'N/A',
          `"${repo.html_url || ''}"`
        ];
        csvContent += row.join(',') + '\n';
      });
      
      csvContent += '\n';
    }

    if (data.collaborators && data.collaborators.length > 0) {
      // Collaborator data
      csvContent += 'COLLABORATORS\n';
      csvContent += 'Username,Display Name,Email,Type,Repositories,Profile URL\n';
      
      data.collaborators.forEach(collab => {
        const row = [
          `"${collab.login || ''}"`,
          `"${collab.name || collab.login || ''}"`,
          `"${collab.email || 'N/A'}"`,
          `"${collab.type || 'User'}"`,
          `"${Array.isArray(collab.repositories) ? collab.repositories.join('; ') : 'N/A'}"`,
          `"${collab.html_url || ''}"`
        ];
        csvContent += row.join(',') + '\n';
      });
    }

    return csvContent;
  };

  const exportAsJSON = () => {
    const exportData = {
      ...data,
      metadata: {
        ...data.metadata,
        exportDate: new Date().toISOString(),
        format: 'json'
      }
    };
    
    return JSON.stringify(exportData, null, 2);
  };

  const exportAsText = () => {
    let textContent = '';
    
    // Header
    textContent += '='.repeat(50) + '\n';
    textContent += 'GitHub Security Operations Audit Report\n';
    textContent += '='.repeat(50) + '\n';
    textContent += `Export Date: ${new Date().toLocaleDateString()}\n`;
    if (data.metadata?.username) {
      textContent += `GitHub User: ${data.metadata.username}\n`;
    }
    textContent += '\n';

    // Summary
    textContent += 'SUMMARY\n';
    textContent += '-'.repeat(20) + '\n';
    if (data.metadata?.totalRepositories) {
      textContent += `Total Repositories: ${data.metadata.totalRepositories}\n`;
    }
    if (data.metadata?.totalCollaborators) {
      textContent += `Total Collaborators: ${data.metadata.totalCollaborators}\n`;
    }
    textContent += '\n';

    // Repositories
    if (data.repositories && data.repositories.length > 0) {
      textContent += 'REPOSITORIES\n';
      textContent += '-'.repeat(20) + '\n';
      
      data.repositories.forEach(repo => {
        textContent += `Name: ${repo.name}\n`;
        textContent += `Full Name: ${repo.full_name}\n`;
        textContent += `Description: ${repo.description || 'No description'}\n`;
        textContent += `Language: ${repo.language || 'N/A'}\n`;
        textContent += `Stars: ${repo.stargazers_count || 0}\n`;
        textContent += `Forks: ${repo.forks_count || 0}\n`;
        textContent += `Private: ${repo.private ? 'Yes' : 'No'}\n`;
        textContent += `Last Updated: ${repo.updated_at ? new Date(repo.updated_at).toLocaleDateString() : 'N/A'}\n`;
        textContent += `URL: ${repo.html_url}\n`;
        textContent += '\n';
      });
    }

    // Collaborators
    if (data.collaborators && data.collaborators.length > 0) {
      textContent += 'COLLABORATORS\n';
      textContent += '-'.repeat(20) + '\n';
      
      data.collaborators.forEach(collab => {
        textContent += `Username: ${collab.login}\n`;
        textContent += `Display Name: ${collab.name || collab.login}\n`;
        textContent += `Type: ${collab.type || 'User'}\n`;
        if (Array.isArray(collab.repositories)) {
          textContent += `Repositories: ${collab.repositories.join(', ')}\n`;
        }
        textContent += `Profile: ${collab.html_url}\n`;
        textContent += '\n';
      });
    }

    return textContent;
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      let content: string;
      let mimeType: string;
      let extension: string;
      
      switch (exportFormat) {
        case 'csv':
          content = exportAsCSV();
          mimeType = 'text/csv';
          extension = 'csv';
          break;
        case 'json':
          content = exportAsJSON();
          mimeType = 'application/json';
          extension = 'json';
          break;
        case 'txt':
          content = exportAsText();
          mimeType = 'text/plain';
          extension = 'txt';
          break;
        default:
          throw new Error('Unsupported export format');
      }
      
      const date = formatDate(new Date());
      const fileName = `${filename}-${date}.${extension}`;
      
      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      downloadFile(content, fileName, mimeType);
    } catch (error) {
      console.error('Export failed:', error);
      // Here you could show a toast notification or error message
    } finally {
      setIsExporting(false);
    }
  };

  const getFormatIcon = (format: ExportFormat) => {
    switch (format) {
      case 'csv':
        return <Table className="w-4 h-4" />;
      case 'json':
        return <Code className="w-4 h-4" />;
      case 'txt':
        return <FileText className="w-4 h-4" />;
      default:
        return <Download className="w-4 h-4" />;
    }
  };

  const hasData = (data.repositories && data.repositories.length > 0) || 
                  (data.collaborators && data.collaborators.length > 0);

  if (!hasData) {
    return (
      <div className={`text-gray-500 dark:text-gray-400 text-sm ${className}`}>
        No data available for export
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <select
        value={exportFormat}
        onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
        className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="csv">CSV (Excel)</option>
        <option value="json">JSON (Data)</option>
        <option value="txt">Text (Report)</option>
      </select>

      <ButtonLoading
        loading={isExporting}
        loadingText="Exporting..."
        onClick={handleExport}
        variant="secondary"
        className="inline-flex items-center px-3 py-2 text-sm"
      >
        {getFormatIcon(exportFormat)}
        <span className="ml-2">Export</span>
      </ButtonLoading>
    </div>
  );
}

export default ExportManager;
