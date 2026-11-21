'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AlertCircle, Loader, TrendingUp, Package, Users, DollarSign } from 'lucide-react';
import { formatNPR } from '@/lib/currency';

interface Analytics {
  overview: {
    totalOrders: number;
    totalRevenue: number;
    paidOrders: number;
    avgOrderValue: number;
  };
  orderStatusBreakdown: Record<string, number>;
  revenueByDate: Array<{ date: string; revenue: number; orderCount: number }>;
  topParts: Array<{ partId: number; partName: string; quantity: number; orderCount: number }>;
  customerMetrics: {
    totalCustomers: number;
    repeatCustomers: number;
    newCustomers: number;
  };
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#F59E0B',
  PAID: '#10B981',
  CONFIRMED: '#3B82F6',
  SHIPPED: '#8B5CF6',
  CANCELLED: '#EF4444',
  FAILED: '#DC2626',
};

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/admin/analytics');
        if (!response.ok) throw new Error('Failed to fetch analytics');
        const data = await response.json();
        setAnalytics(data);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center h-full">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm">{error || 'Failed to load analytics'}</span>
        </div>
      </div>
    );
  }

  const statusData = Object.entries(analytics.orderStatusBreakdown).map(([status, count]) => ({
    name: status,
    value: count,
    color: STATUS_COLORS[status] || '#6B7280',
  }));

  return (
    <div className="p-8 bg-white dark:bg-gray-950 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Analytics Dashboard</h1>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Revenue</p>
              <p className="text-3xl font-bold">{formatNPR(analytics.overview.totalRevenue)}</p>
            </div>
            <DollarSign className="h-12 w-12 opacity-20" />
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Total Orders</p>
              <p className="text-3xl font-bold">{analytics.overview.totalOrders}</p>
            </div>
            <Package className="h-12 w-12 opacity-20" />
          </div>
        </div>

        {/* Avg Order Value */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Avg Order Value</p>
              <p className="text-3xl font-bold">{formatNPR(analytics.overview.avgOrderValue)}</p>
            </div>
            <TrendingUp className="h-12 w-12 opacity-20" />
          </div>
        </div>

        {/* Total Customers */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Total Customers</p>
              <p className="text-3xl font-bold">{analytics.customerMetrics.totalCustomers}</p>
            </div>
            <Users className="h-12 w-12 opacity-20" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Revenue Trend */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue Trend (30 days)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.revenueByDate}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={(value) => formatNPR(value).replace('Rs ', '')} />
              <Tooltip formatter={(value: unknown) => formatNPR(Number(value))} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} name="Revenue" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Order Status Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Order Status</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name} (${value})`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Products */}
      <div className="grid grid-cols-1 gap-8 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Selling Parts</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.topParts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="partName" angle={-45} textAnchor="end" height={80} interval={0} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="quantity" fill="#10B981" name="Units Sold" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Customer Breakdown */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Customer Metrics</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.customerMetrics.totalCustomers}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Customers</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.customerMetrics.repeatCustomers}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Repeat Customers</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.customerMetrics.newCustomers}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">New Customers</p>
          </div>
        </div>
      </div>
    </div>
  );
}
