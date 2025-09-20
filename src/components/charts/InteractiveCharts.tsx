import React, { useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2'
import { motion } from 'framer-motion'
import { animationVariants } from '../../utils/animations'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

// Chart theme configuration
export const getChartTheme = (isDark: boolean) => ({
  backgroundColor: isDark ? '#1e293b' : '#ffffff',
  borderColor: isDark ? '#374151' : '#e5e7eb',
  textColor: isDark ? '#f8fafc' : '#1f2937',
  gridColor: isDark ? '#374151' : '#f3f4f6',
  tooltipBackground: isDark ? '#374151' : '#ffffff',
  tooltipBorder: isDark ? '#4b5563' : '#d1d5db',
})

// Security Metrics Chart
interface SecurityMetricsProps {
  data: {
    vulnerabilities: { critical: number; high: number; medium: number; low: number }
    repositories: number
    lastScan: string
  }
  isDark?: boolean
}

export const SecurityMetricsChart: React.FC<SecurityMetricsProps> = ({ 
  data, 
  isDark = true 
}) => {
  const theme = getChartTheme(isDark)
  
  const chartData = useMemo(() => ({
    labels: ['Critical', 'High', 'Medium', 'Low'],
    datasets: [
      {
        label: 'Vulnerabilities',
        data: [
          data.vulnerabilities.critical,
          data.vulnerabilities.high,
          data.vulnerabilities.medium,
          data.vulnerabilities.low,
        ],
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',   // Critical - Red
          'rgba(245, 158, 11, 0.8)',  // High - Orange
          'rgba(59, 130, 246, 0.8)',  // Medium - Blue
          'rgba(16, 185, 129, 0.8)',  // Low - Green
        ],
        borderColor: [
          'rgb(239, 68, 68)',
          'rgb(245, 158, 11)',
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
        ],
        borderWidth: 2,
      },
    ],
  }), [data])

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: theme.textColor,
          padding: 20,
          font: { size: 12 },
        },
      },
      tooltip: {
        backgroundColor: theme.tooltipBackground,
        titleColor: theme.textColor,
        bodyColor: theme.textColor,
        borderColor: theme.tooltipBorder,
        borderWidth: 1,
        cornerRadius: 8,
      },
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart' as const,
    },
  }), [theme])

  return (
    <motion.div
      className="h-64 w-full"
      variants={animationVariants.chartEntry}
      initial="initial"
      animate="animate"
    >
      <Doughnut data={chartData} options={options} />
    </motion.div>
  )
}

// Copilot Usage Trend Chart
interface CopilotUsageTrendProps {
  data: Array<{
    date: string
    activeUsers: number
    suggestions: number
    acceptedSuggestions: number
  }>
  isDark?: boolean
}

export const CopilotUsageTrendChart: React.FC<CopilotUsageTrendProps> = ({ 
  data, 
  isDark = true 
}) => {
  const theme = getChartTheme(isDark)
  
  const chartData = useMemo(() => ({
    labels: data.map(item => new Date(item.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Active Users',
        data: data.map(item => item.activeUsers),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Suggestions',
        data: data.map(item => item.suggestions),
        borderColor: 'rgb(139, 92, 246)',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Accepted',
        data: data.map(item => item.acceptedSuggestions),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  }), [data])

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: theme.textColor,
          padding: 20,
          font: { size: 12 },
        },
      },
      tooltip: {
        backgroundColor: theme.tooltipBackground,
        titleColor: theme.textColor,
        bodyColor: theme.textColor,
        borderColor: theme.tooltipBorder,
        borderWidth: 1,
        cornerRadius: 8,
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          color: theme.gridColor,
        },
        ticks: {
          color: theme.textColor,
        },
      },
      y: {
        display: true,
        grid: {
          color: theme.gridColor,
        },
        ticks: {
          color: theme.textColor,
        },
      },
    },
    elements: {
      point: {
        hoverBackgroundColor: theme.backgroundColor,
        hoverBorderWidth: 3,
      },
    },
    animation: {
      duration: 1500,
      easing: 'easeOutQuart' as const,
    },
  }), [theme])

  return (
    <motion.div
      className="h-80 w-full"
      variants={animationVariants.chartEntry}
      initial="initial"
      animate="animate"
    >
      <Line data={chartData} options={options} />
    </motion.div>
  )
}

// Repository Activity Chart
interface RepositoryActivityProps {
  data: Array<{
    name: string
    commits: number
    issues: number
    pullRequests: number
  }>
  isDark?: boolean
}

export const RepositoryActivityChart: React.FC<RepositoryActivityProps> = ({ 
  data, 
  isDark = true 
}) => {
  const theme = getChartTheme(isDark)
  
  const chartData = useMemo(() => ({
    labels: data.map(item => item.name),
    datasets: [
      {
        label: 'Commits',
        data: data.map(item => item.commits),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Issues',
        data: data.map(item => item.issues),
        backgroundColor: 'rgba(245, 158, 11, 0.8)',
        borderColor: 'rgb(245, 158, 11)',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Pull Requests',
        data: data.map(item => item.pullRequests),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  }), [data])

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: theme.textColor,
          padding: 20,
          font: { size: 12 },
        },
      },
      tooltip: {
        backgroundColor: theme.tooltipBackground,
        titleColor: theme.textColor,
        bodyColor: theme.textColor,
        borderColor: theme.tooltipBorder,
        borderWidth: 1,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          color: theme.gridColor,
        },
        ticks: {
          color: theme.textColor,
          maxRotation: 45,
        },
      },
      y: {
        display: true,
        grid: {
          color: theme.gridColor,
        },
        ticks: {
          color: theme.textColor,
        },
        beginAtZero: true,
      },
    },
    animation: {
      duration: 1200,
      easing: 'easeOutBounce' as const,
    },
  }), [theme])

  return (
    <motion.div
      className="h-72 w-full"
      variants={animationVariants.chartEntry}
      initial="initial"
      animate="animate"
    >
      <Bar data={chartData} options={options} />
    </motion.div>
  )
}

// Team Performance Radar Chart
interface TeamPerformanceProps {
  data: {
    codeQuality: number
    security: number
    productivity: number
    collaboration: number
    innovation: number
  }
  teamName: string
  isDark?: boolean
}

export const TeamPerformanceChart: React.FC<TeamPerformanceProps> = ({ 
  data, 
  teamName,
  isDark = true 
}) => {
  const theme = getChartTheme(isDark)
  
  const chartData = useMemo(() => ({
    labels: ['Code Quality', 'Security', 'Productivity', 'Collaboration', 'Innovation'],
    datasets: [
      {
        label: teamName,
        data: [
          data.codeQuality,
          data.security,
          data.productivity,
          data.collaboration,
          data.innovation,
        ],
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(59, 130, 246)',
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  }), [data, teamName])

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: theme.textColor,
          padding: 20,
          font: { size: 12 },
        },
      },
      tooltip: {
        backgroundColor: theme.tooltipBackground,
        titleColor: theme.textColor,
        bodyColor: theme.textColor,
        borderColor: theme.tooltipBorder,
        borderWidth: 1,
        cornerRadius: 8,
      },
    },
    scales: {
      r: {
        angleLines: {
          color: theme.gridColor,
        },
        grid: {
          color: theme.gridColor,
        },
        pointLabels: {
          color: theme.textColor,
          font: { size: 11 },
        },
        ticks: {
          color: theme.textColor,
          backdropColor: 'transparent',
        },
        beginAtZero: true,
        max: 100,
      },
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart' as const,
    },
  }), [theme])

  return (
    <motion.div
      className="h-72 w-full"
      variants={animationVariants.chartEntry}
      initial="initial"
      animate="animate"
    >
      <Radar data={chartData} options={options} />
    </motion.div>
  )
}
