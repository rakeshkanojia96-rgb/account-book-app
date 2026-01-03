import { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import { 
  TrendingUp, 
  TrendingDown, 
  IndianRupee, 
  ShoppingCart, 
  Receipt, 
  Laptop,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Package
} from 'lucide-react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { supabase } from '../lib/supabase'
import { format, startOfMonth, endOfMonth, startOfYear, eachMonthOfInterval } from 'date-fns'
import { useFinancialYearStore } from '../store/financialYearStore'

function Dashboard() {
  const { user } = useUser()
  const navigate = useNavigate()
  const { financialYear, getFinancialYearDates } = useFinancialYearStore()
  const [loading, setLoading] = useState(true)
  const [viewRange, setViewRange] = useState('financialYear')
  const [metrics, setMetrics] = useState({
    totalSales: 0,
    totalPurchases: 0,
    totalExpenses: 0,
    netProfit: 0,
    assetsValue: 0,
    monthlySales: [],
    platformSales: [],
    recentTransactions: []
  })

  useEffect(() => {
    fetchDashboardData()
  }, [financialYear, viewRange])

  const fetchDashboardData = async () => {
    try {
      if (!user) return

      let sales = []
      let purchases = []
      let expenses = []
      let assets = []

      let fyStart
      let fyEnd

      if (viewRange === 'all') {
        const { data: salesData } = await supabase
          .from('sales')
          .select('*')
          .eq('user_id', user.id)

        const { data: purchasesData } = await supabase
          .from('purchases')
          .select('*')
          .eq('user_id', user.id)

        const { data: expensesData } = await supabase
          .from('expenses')
          .select('*')
          .eq('user_id', user.id)

        const { data: assetsData } = await supabase
          .from('assets')
          .select('*')
          .eq('user_id', user.id)

        sales = salesData || []
        purchases = purchasesData || []
        expenses = expensesData || []
        assets = assetsData || []

        const allDates = [
          ...sales.map((s) => new Date(s.date)),
          ...purchases.map((p) => new Date(p.date)),
        ].filter((d) => !Number.isNaN(d.getTime()))

        if (allDates.length > 0) {
          fyStart = new Date(Math.min(...allDates.map((d) => d.getTime())))
          fyEnd = new Date(Math.max(...allDates.map((d) => d.getTime())))
        } else {
          const today = new Date()
          fyStart = today
          fyEnd = today
        }
      } else {
        const fyDates = getFinancialYearDates(financialYear)
        if (!fyDates) return

        fyStart = new Date(fyDates.start)
        fyEnd = new Date(fyDates.end)

        const { data: salesData } = await supabase
          .from('sales')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', fyStart.toISOString())
          .lte('date', fyEnd.toISOString())

        const { data: purchasesData } = await supabase
          .from('purchases')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', fyStart.toISOString())
          .lte('date', fyEnd.toISOString())

        const { data: expensesData } = await supabase
          .from('expenses')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', fyStart.toISOString())
          .lte('date', fyEnd.toISOString())

        const { data: assetsData } = await supabase
          .from('assets')
          .select('*')
          .eq('user_id', user.id)

        sales = salesData || []
        purchases = purchasesData || []
        expenses = expensesData || []
        assets = assetsData || []
      }

      // Calculate metrics
      // Neon returns NUMERIC columns as strings, so always cast to Number before summing
      const totalSales = sales?.reduce((sum, s) => sum + (Number(s.amount) || 0), 0) || 0
      const totalPurchases = purchases?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0
      const totalExpenses = expenses?.reduce((sum, e) => sum + (Number(e.amount) || 0), 0) || 0
      const assetsValue = assets?.reduce((sum, a) => sum + (Number(a.current_value) || 0), 0) || 0
      const netProfit = totalSales - totalPurchases - totalExpenses

      // Platform-wise sales
      const platformData = {}
      sales?.forEach(s => {
        const platform = s.platform || 'Offline'
        platformData[platform] = (platformData[platform] || 0) + (Number(s.amount) || 0)
      })

      const platformSales = Object.entries(platformData).map(([name, value]) => ({
        name,
        value
      }))

      // Monthly sales data
      const months = eachMonthOfInterval({ start: fyStart, end: fyEnd })
      const monthlySales = months.map(month => {
        const monthSales = sales?.filter(s => {
          const saleDate = new Date(s.date)
          return saleDate >= startOfMonth(month) && saleDate <= endOfMonth(month)
        }).reduce((sum, s) => sum + (Number(s.amount) || 0), 0) || 0

        const monthPurchases = purchases?.filter(p => {
          const purchaseDate = new Date(p.date)
          return purchaseDate >= startOfMonth(month) && purchaseDate <= endOfMonth(month)
        }).reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0

        return {
          month: format(month, 'MMM'),
          sales: monthSales,
          purchases: monthPurchases,
          profit: monthSales - monthPurchases
        }
      })

      setMetrics({
        totalSales,
        totalPurchases,
        totalExpenses,
        netProfit,
        assetsValue,
        monthlySales,
        platformSales,
        recentTransactions: []
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatINR = (val) => {
    const num = Number(val) || 0
    return num.toLocaleString('en-IN', { minimumFractionDigits: 2 })
  }

  const StatCard = ({ title, value, icon: Icon, trend, trendValue, color, onClick }) => (
    <div 
      onClick={onClick}
      className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <div className="flex items-baseline space-x-2">
            <IndianRupee className="w-5 h-5 text-gray-400" />
            <h3 className="text-2xl font-bold text-gray-900">
              {formatINR(value)}
            </h3>
          </div>
          {trend && (
            <div className={`flex items-center mt-2 text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              <span className="ml-1">{trendValue}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  )

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <button 
          onClick={() => navigate('/sales')}
          className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Sale
        </button>
        <button 
          onClick={() => navigate('/purchases')}
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Purchase
        </button>
        <button 
          onClick={() => navigate('/expenses')}
          className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Expense
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Sales"
          value={metrics.totalSales}
          icon={TrendingUp}
          color="bg-blue-500"
          onClick={() => navigate('/sales')}
        />
        <StatCard
          title="Total Purchases"
          value={metrics.totalPurchases}
          icon={ShoppingCart}
          color="bg-green-500"
          onClick={() => navigate('/purchases')}
        />
        <StatCard
          title="Total Expenses"
          value={metrics.totalExpenses}
          icon={Receipt}
          color="bg-orange-500"
          onClick={() => navigate('/expenses')}
        />
        <StatCard
          title="Net Profit"
          value={metrics.netProfit}
          icon={metrics.netProfit >= 0 ? TrendingUp : TrendingDown}
          color={metrics.netProfit >= 0 ? 'bg-purple-500' : 'bg-red-500'}
          trend={metrics.netProfit >= 0 ? 'up' : 'down'}
          trendValue={viewRange === 'all' ? 'All Time' : `FY ${financialYear}`}
          onClick={() => navigate('/reports')}
        />
      </div>

      {/* View Range Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-600">
          Viewing: {viewRange === 'all' ? 'All Time (since first record)' : `Financial Year ${financialYear}`}
        </p>
        <div className="inline-flex rounded-lg border border-gray-200 bg-white overflow-hidden">
          <button
            type="button"
            onClick={() => setViewRange('financialYear')}
            className={`px-3 py-1.5 text-sm ${
              viewRange === 'financialYear'
                ? 'bg-primary text-white'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            FY {financialYear}
          </button>
          <button
            type="button"
            onClick={() => setViewRange('all')}
            className={`px-3 py-1.5 text-sm border-l border-gray-200 ${
              viewRange === 'all'
                ? 'bg-primary text-white'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            All Time
          </button>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Sales Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Monthly Sales & Purchases</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics.monthlySales}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
              <Legend />
              <Bar dataKey="sales" fill="#3b82f6" name="Sales" />
              <Bar dataKey="purchases" fill="#10b981" name="Purchases" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Platform Sales Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Platform-wise Sales</h3>
          {metrics.platformSales.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={metrics.platformSales}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {metrics.platformSales.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-300 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No sales data yet</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Profit Trend */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Profit Trend</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={metrics.monthlySales}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
            <Legend />
            <Line type="monotone" dataKey="profit" stroke="#8b5cf6" strokeWidth={2} name="Profit" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default Dashboard
