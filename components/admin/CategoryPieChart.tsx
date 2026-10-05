'use client'

import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts'

interface CategoryData {
  name: string
  value: number
  color: string
}

interface CategoryPieChartProps {
  data: CategoryData[]
}

export default function CategoryPieChart({ data }: CategoryPieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
      <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-6">
        Revenue by Category
      </h2>
      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ₹${value.toFixed(0)}`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              isAnimationActive={true}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => `₹${value.toFixed(2)}`}
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
              className="dark:bg-zinc-800 dark:border-zinc-700"
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {data.map((item, index) => (
          <div key={index} className="text-center">
            <div className="flex items-center justify-center mb-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: item.color }}
              ></div>
              <span className="text-xs text-zinc-600 dark:text-zinc-400 ml-2">{item.name}</span>
            </div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {((item.value / total) * 100).toFixed(1)}%
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
