import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend 
} from 'recharts';
import { 
  TrendingUp, FileText, AlertTriangle, CheckCircle, 
  Clock, Download, Filter, Calendar, RefreshCw
} from 'lucide-react';
import { analyticsService } from '../../services/api';

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#6B7280'];

const AnalyticsDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [trendsData, setTrendsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(() => {
      loadDashboardData(true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadTrendsData();
  }, [selectedPeriod]);

  const loadDashboardData = async (isAutoRefresh = false) => {
    try {
      if (isAutoRefresh) {
        setIsRefreshing(true);
      }
      
      const data = await analyticsService.getDashboard();
      setDashboardData(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      if (isAutoRefresh) {
        setIsRefreshing(false);
      }
    }
  };

  const loadTrendsData = async () => {
    try {
      const data = await analyticsService.getTrends(selectedPeriod);
      setTrendsData(data);
    } catch (err) {
      setError('Failed to load trends data');
      console.error('Trends error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format = 'json') => {
    try {
      const blob = await analyticsService.exportData(format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contract-analytics.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-300 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-300 rounded-lg"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-300 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) return null;

  // Prepare chart data
  const statusData = Object.entries(dashboardData.contractStats.byStatus || {}).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: count
  }));

  const riskData = Object.entries(dashboardData.riskDistribution || {}).map(([level, data]) => ({
    name: level.charAt(0).toUpperCase() + level.slice(1),
    value: data.count,
    avgScore: data.avgScore
  }));

  const fileTypeData = Object.entries(dashboardData.fileTypeStats || {}).map(([type, count]) => ({
    name: type,
    value: count
  }));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
            {isRefreshing && (
              <div className="flex items-center space-x-2 text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-200 border-t-blue-600"></div>
                <span className="text-sm">Updating...</span>
              </div>
            )}
            {lastUpdated && (
              <div className="flex items-center text-sm text-gray-500">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
            )}
          </div>
          <p className="text-gray-600">Comprehensive real-time insights into your contract analysis</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => loadDashboardData(true)}
            disabled={isRefreshing}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button
            onClick={() => handleExport('json')}
            className="btn-secondary flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Contracts</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardData.contractStats.total}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {dashboardData.contractStats.byStatus.completed || 0}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">High Risk</p>
              <p className="text-2xl font-bold text-red-600">
                {dashboardData.contractStats.byStatus['high-risk'] || 0}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Processing</p>
              <p className="text-2xl font-bold text-yellow-600">
                {dashboardData.contractStats.byStatus.processing || 0}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contract Status Distribution */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Contract Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Distribution */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={riskData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trends Chart */}
      {trendsData && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendsData.uploadTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#3B82F6" name="Total Uploads" />
              <Line type="monotone" dataKey="completed" stroke="#10B981" name="Completed" />
              <Line type="monotone" dataKey="highRisk" stroke="#EF4444" name="High Risk" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* File Types */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">File Types</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={fileTypeData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={60} />
              <Tooltip />
              <Bar dataKey="value" fill="#6B7280" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Processing Stats */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Processing Performance</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Average Processing Time</span>
              <span className="font-semibold">
                {dashboardData.processingStats.avgProcessingTimeMinutes}m
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Fastest Processing</span>
              <span className="font-semibold text-green-600">
                {dashboardData.processingStats.minProcessingTimeMinutes}m
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Slowest Processing</span>
              <span className="font-semibold text-red-600">
                {dashboardData.processingStats.maxProcessingTimeMinutes}m
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Processed</span>
              <span className="font-semibold">
                {dashboardData.processingStats.totalProcessed}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity & Top Risk Factors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Contracts</h3>
          <div className="space-y-3">
            {dashboardData.recentActivity.map((contract, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 truncate">{contract.originalName}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(contract.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {contract.analysisResults?.riskScore && (
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      contract.analysisResults.riskScore > 70 
                        ? 'bg-red-100 text-red-800'
                        : contract.analysisResults.riskScore > 30
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      Risk: {contract.analysisResults.riskScore}
                    </span>
                  )}
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    contract.status === 'completed' 
                      ? 'bg-green-100 text-green-800'
                      : contract.status === 'high-risk'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {contract.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Risk Factors */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Common Risk Factors</h3>
          <div className="space-y-3">
            {dashboardData.topRiskFactors.map((risk, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{risk._id}</p>
                  <p className="text-sm text-gray-600">
                    Confidence: {(risk.avgConfidence * 100).toFixed(0)}%
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold text-gray-700">{risk.count}</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    risk.severity === 'high' 
                      ? 'bg-red-100 text-red-800'
                      : risk.severity === 'medium'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {risk.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Statistics */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Chat Activity</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{dashboardData.chatStats.totalSessions}</p>
            <p className="text-gray-600">Total Sessions</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{dashboardData.chatStats.totalMessages}</p>
            <p className="text-gray-600">Total Messages</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">
              {dashboardData.chatStats.avgMessagesPerSession.toFixed(1)}
            </p>
            <p className="text-gray-600">Avg Messages/Session</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;