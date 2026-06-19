import { useState, useEffect } from 'react'
import { getAnalyticsSummary } from '@/api/analytics'
import { formatNPR } from '@/utils/currency'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const RANGE_OPTIONS = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
]

export default function AnalyticsPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState(30)

  useEffect(() => {
    loadData()
  }, [range])

  const loadData = async () => {
    setLoading(true)
    try {
      const to = new Date()
      const from = new Date()
      from.setDate(from.getDate() - range)
      const fromStr = from.toISOString().split('T')[0]
      const toStr = to.toISOString().split('T')[0]
      const res = await getAnalyticsSummary(fromStr, toStr)
      setData(res)
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading && !data) {
    return (
      <>
        <div className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-10 bg-zinc-200 rounded w-48" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="h-24 bg-zinc-200 rounded-2xl" />
                <div className="h-24 bg-zinc-200 rounded-2xl" />
                <div className="h-24 bg-zinc-200 rounded-2xl" />
              </div>
              <div className="h-80 bg-zinc-200 rounded-2xl" />
            </div>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <h1 className="text-3xl font-bold text-zinc-900">Sales Analytics</h1>
            <div className="flex gap-2">
              {RANGE_OPTIONS.map((opt) => (
                <Button
                  key={opt.days}
                  variant={range === opt.days ? 'default' : 'outline'}
                  size="sm"
                  className={range === opt.days ? 'bg-[#E60012] hover:bg-[#C5000F]' : ''}
                  onClick={() => setRange(opt.days)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>

          {data && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
                  <p className="text-sm text-zinc-600 mb-1">Total Revenue</p>
                  <p className="text-2xl font-bold text-[#E60012]">{formatNPR(data.totalRevenue)}</p>
                </div>
                <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
                  <p className="text-sm text-zinc-600 mb-1">Total Orders</p>
                  <p className="text-2xl font-bold text-zinc-900">{data.totalOrders ?? 0}</p>
                </div>
                <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
                  <p className="text-sm text-zinc-600 mb-1">Avg Order Value</p>
                  <p className="text-2xl font-bold text-zinc-900">{formatNPR(data.avgOrderValue)}</p>
                </div>
              </div>

              {data.ordersByDay?.length > 0 && (
                <>
                  <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm mb-8">
                    <h3 className="font-semibold text-zinc-900 mb-4">Revenue by Day</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={data.ordersByDay}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip formatter={(value) => [formatNPR(value), 'Revenue']} />
                        <Legend />
                        <Line type="monotone" dataKey="revenue" stroke="#E60012" strokeWidth={2} name="Revenue" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm mb-8">
                    <h3 className="font-semibold text-zinc-900 mb-4">Orders by Day</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={data.ordersByDay}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" fill="#E60012" name="Orders" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}

              {data.topParts?.length > 0 && (
                <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm mb-8">
                  <h3 className="font-semibold text-zinc-900 mb-4">Top Selling Parts</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-zinc-200">
                          <th className="text-left py-3 px-2 font-semibold text-zinc-600">Part</th>
                          <th className="text-right py-3 px-2 font-semibold text-zinc-600">Qty Sold</th>
                          <th className="text-right py-3 px-2 font-semibold text-zinc-600">Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.topParts.map((p, i) => (
                          <tr key={i} className="border-b border-zinc-100">
                            <td className="py-3 px-2">{p.partName}</td>
                            <td className="py-3 px-2 text-right">{p.qtySold}</td>
                            <td className="py-3 px-2 text-right font-semibold">{formatNPR(p.revenue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {data.lowStockParts?.length > 0 && (
                <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
                  <h3 className="font-semibold text-zinc-900 mb-4">Low Stock Parts</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-zinc-200">
                          <th className="text-left py-3 px-2 font-semibold text-zinc-600">Part</th>
                          <th className="text-right py-3 px-2 font-semibold text-zinc-600">Quantity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.lowStockParts.map((p, i) => (
                          <tr key={i} className="border-b border-zinc-100">
                            <td className="py-3 px-2">{p.partName}</td>
                            <td className="py-3 px-2 text-right">
                              <span className={p.quantity <= 5 ? 'text-red-600 font-semibold' : ''}>
                                {p.quantity}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {(!data.ordersByDay || data.ordersByDay.length === 0) &&
                (!data.topParts || data.topParts.length === 0) &&
                (!data.lowStockParts || data.lowStockParts.length === 0) && (
                  <p className="text-zinc-500 text-center py-12">No data for the selected range.</p>
                )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}
