'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface MonthlyData {
  month: string
  revenue: number
}

interface RevenueChartProps {
  data: MonthlyData[]
}

export default function RevenueChart({ data }: RevenueChartProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
      <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-6">
        Revenue Trend (12 Months)
      </h2>
      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-zinc-700" />
            <XAxis
              dataKey="month"
              tick={{ fill: '#6b7280' }}
              className="dark:fill-zinc-400"
            />
            <YAxis
              tick={{ fill: '#6b7280' }}
              className="dark:fill-zinc-400"
              label={{ value: 'Revenue (₹)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
              className="dark:bg-zinc-800 dark:border-zinc-700"
              formatter={(value: number) => `₹${value.toFixed(2)}`}
            />
            <Legend />
            <Bar
              dataKey="revenue"
              fill="#E60012"
              radius={[8, 8, 0, 0]}
              name="Monthly Revenue"
              isAnimationActive={true}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
