import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Download, FileText, Calendar } from 'lucide-react'
import { format, startOfYear, endOfYear } from 'date-fns'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { useFinancialYearStore } from '../store/financialYearStore'

function Reports() {
  const [loading, setLoading] = useState(true)
  const [reportType, setReportType] = useState('profit-loss')
  const { financialYear, setFinancialYear, financialYears } = useFinancialYearStore()
  const [reportData, setReportData] = useState({
    sales: [],
    purchases: [],
    expenses: [],
    assets: [],
    totalSales: 0,
    totalPurchases: 0,
    totalExpenses: 0,
    grossProfit: 0,
    netProfit: 0,
    assetsValue: 0
  })

  useEffect(() => {
    fetchReportData()
  }, [financialYear])

  const fetchReportData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      // Get FY dates from store
      const fyDates = useFinancialYearStore.getState().getFinancialYearDates(financialYear)
      if (!fyDates) return
      
      const fyStart = new Date(fyDates.start)
      const fyEnd = new Date(fyDates.end)

      // Fetch all data
      const [salesRes, purchasesRes, expensesRes, assetsRes] = await Promise.all([
        supabase.from('sales').select('*').eq('user_id', user.id)
          .gte('date', fyStart.toISOString()).lte('date', fyEnd.toISOString()),
        supabase.from('purchases').select('*').eq('user_id', user.id)
          .gte('date', fyStart.toISOString()).lte('date', fyEnd.toISOString()),
        supabase.from('expenses').select('*').eq('user_id', user.id)
          .gte('date', fyStart.toISOString()).lte('date', fyEnd.toISOString()),
        supabase.from('assets').select('*').eq('user_id', user.id)
      ])

      const sales = salesRes.data || []
      const purchases = purchasesRes.data || []
      const expenses = expensesRes.data || []
      const assets = assetsRes.data || []

      const totalSales = sales.reduce((sum, s) => sum + (s.total_amount || 0), 0)
      const totalPurchases = purchases.reduce((sum, p) => sum + (p.total_amount || 0), 0)
      const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0)
      const assetsValue = assets.reduce((sum, a) => sum + (a.current_value || 0), 0)
      
      const grossProfit = totalSales - totalPurchases
      const netProfit = grossProfit - totalExpenses

      setReportData({
        sales,
        purchases,
        expenses,
        assets,
        totalSales,
        totalPurchases,
        totalExpenses,
        grossProfit,
        netProfit,
        assetsValue
      })
    } catch (error) {
      console.error('Error fetching report data:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportToPDF = () => {
    const doc = new jsPDF()
    const { data: { user } } = supabase.auth.getUser()
    
    doc.setFontSize(18)
    doc.text(reportType === 'profit-loss' ? 'Profit & Loss Statement' : 'Balance Sheet', 14, 20)
    doc.setFontSize(11)
    doc.text(`Financial Year: ${financialYear}`, 14, 28)
    doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy')}`, 14, 34)

    if (reportType === 'profit-loss') {
      const tableData = [
        ['Revenue', '', ''],
        ['Total Sales', '', `₹${reportData.totalSales.toLocaleString('en-IN')}`],
        ['', '', ''],
        ['Cost of Goods Sold', '', ''],
        ['Total Purchases', '', `₹${reportData.totalPurchases.toLocaleString('en-IN')}`],
        ['', '', ''],
        ['Gross Profit', '', `₹${reportData.grossProfit.toLocaleString('en-IN')}`],
        ['', '', ''],
        ['Operating Expenses', '', ''],
        ['Total Expenses', '', `₹${reportData.totalExpenses.toLocaleString('en-IN')}`],
        ['', '', ''],
        ['Net Profit', '', `₹${reportData.netProfit.toLocaleString('en-IN')}`],
      ]

      doc.autoTable({
        startY: 40,
        head: [['Particulars', '', 'Amount']],
        body: tableData,
        theme: 'striped',
      })
    } else {
      const tableData = [
        ['ASSETS', '', ''],
        ['Current Assets', '', `₹${reportData.assetsValue.toLocaleString('en-IN')}`],
        ['', '', ''],
        ['LIABILITIES', '', ''],
        ['Capital', '', `₹${reportData.netProfit.toLocaleString('en-IN')}`],
      ]

      doc.autoTable({
        startY: 40,
        head: [['Particulars', '', 'Amount']],
        body: tableData,
        theme: 'striped',
      })
    }

    doc.save(`${reportType}-${financialYear}.pdf`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Financial Reports</h2>
          <p className="text-gray-600">View and export financial statements</p>
        </div>
        <button
          onClick={exportToPDF}
          className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
        >
          <Download className="w-4 h-4 mr-2" />
          Export PDF
        </button>
      </div>

      {/* Report Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            >
              <option value="profit-loss">Profit & Loss Statement</option>
              <option value="balance-sheet">Balance Sheet</option>
              <option value="cash-flow">Cash Flow Statement</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Financial Year</label>
            <select
              value={financialYear}
              onChange={(e) => setFinancialYear(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            >
              {financialYears.map(fy => (
                <option key={fy.value} value={fy.value}>{fy.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Profit & Loss Statement */}
      {reportType === 'profit-loss' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900">Profit & Loss Statement</h3>
            <p className="text-sm text-gray-600">For the Financial Year {financialYear}</p>
          </div>
          
          <div className="p-6">
            <table className="w-full">
              <tbody className="divide-y divide-gray-200">
                {/* Revenue Section */}
                <tr className="bg-blue-50">
                  <td className="px-4 py-3 font-bold text-gray-900" colSpan="2">REVENUE</td>
                  <td className="px-4 py-3 text-right"></td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-gray-700">Sales Revenue</td>
                  <td className="px-4 py-2 text-right text-gray-900"></td>
                  <td className="px-4 py-2 text-right font-semibold text-gray-900">
                    ₹{reportData.totalSales.toLocaleString('en-IN', {minimumFractionDigits: 2})}
                  </td>
                </tr>

                {/* Cost of Goods Sold */}
                <tr className="bg-green-50">
                  <td className="px-4 py-3 font-bold text-gray-900" colSpan="2">COST OF GOODS SOLD</td>
                  <td className="px-4 py-3 text-right"></td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-gray-700">Purchases</td>
                  <td className="px-4 py-2 text-right text-gray-900"></td>
                  <td className="px-4 py-2 text-right font-semibold text-gray-900">
                    ₹{reportData.totalPurchases.toLocaleString('en-IN', {minimumFractionDigits: 2})}
                  </td>
                </tr>

                {/* Gross Profit */}
                <tr className="bg-purple-50">
                  <td className="px-4 py-3 font-bold text-gray-900" colSpan="2">GROSS PROFIT</td>
                  <td className="px-4 py-3 text-right font-bold text-purple-600">
                    ₹{reportData.grossProfit.toLocaleString('en-IN', {minimumFractionDigits: 2})}
                  </td>
                </tr>

                {/* Operating Expenses */}
                <tr className="bg-orange-50">
                  <td className="px-4 py-3 font-bold text-gray-900" colSpan="2">OPERATING EXPENSES</td>
                  <td className="px-4 py-3 text-right"></td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-gray-700">Total Expenses</td>
                  <td className="px-4 py-2 text-right text-gray-900"></td>
                  <td className="px-4 py-2 text-right font-semibold text-gray-900">
                    ₹{reportData.totalExpenses.toLocaleString('en-IN', {minimumFractionDigits: 2})}
                  </td>
                </tr>

                {/* Net Profit */}
                <tr className="bg-gray-100">
                  <td className="px-4 py-4 font-bold text-lg text-gray-900" colSpan="2">NET PROFIT</td>
                  <td className={`px-4 py-4 text-right font-bold text-lg ${reportData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{reportData.netProfit.toLocaleString('en-IN', {minimumFractionDigits: 2})}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Profit Margin */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Gross Profit Margin</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {reportData.totalSales > 0 ? ((reportData.grossProfit / reportData.totalSales) * 100).toFixed(2) : 0}%
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Net Profit Margin</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {reportData.totalSales > 0 ? ((reportData.netProfit / reportData.totalSales) * 100).toFixed(2) : 0}%
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Operating Ratio</p>
                  <p className="text-2xl font-bold text-green-600">
                    {reportData.totalSales > 0 ? ((reportData.totalExpenses / reportData.totalSales) * 100).toFixed(2) : 0}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Balance Sheet */}
      {reportType === 'balance-sheet' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900">Balance Sheet</h3>
            <p className="text-sm text-gray-600">As on March 31, {financialYear.split('-')[1]}</p>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Assets Side */}
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b-2 border-blue-500">ASSETS</h4>
                <table className="w-full">
                  <tbody className="divide-y divide-gray-200">
                    <tr className="bg-blue-50">
                      <td className="px-4 py-2 font-semibold text-gray-900">Fixed Assets</td>
                      <td className="px-4 py-2 text-right"></td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-gray-700 pl-8">Property, Plant & Equipment</td>
                      <td className="px-4 py-2 text-right font-semibold text-gray-900">
                        ₹{reportData.assetsValue.toLocaleString('en-IN')}
                      </td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-4 py-3 font-bold text-gray-900">TOTAL ASSETS</td>
                      <td className="px-4 py-3 text-right font-bold text-blue-600">
                        ₹{reportData.assetsValue.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Liabilities Side */}
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b-2 border-green-500">LIABILITIES & EQUITY</h4>
                <table className="w-full">
                  <tbody className="divide-y divide-gray-200">
                    <tr className="bg-green-50">
                      <td className="px-4 py-2 font-semibold text-gray-900">Owner's Equity</td>
                      <td className="px-4 py-2 text-right"></td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-gray-700 pl-8">Retained Earnings</td>
                      <td className="px-4 py-2 text-right font-semibold text-gray-900">
                        ₹{reportData.netProfit.toLocaleString('en-IN')}
                      </td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-4 py-3 font-bold text-gray-900">TOTAL EQUITY</td>
                      <td className="px-4 py-3 text-right font-bold text-green-600">
                        ₹{reportData.netProfit.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cash Flow Statement */}
      {reportType === 'cash-flow' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900">Cash Flow Statement</h3>
            <p className="text-sm text-gray-600">For the Financial Year {financialYear}</p>
          </div>
          
          <div className="p-6">
            <table className="w-full">
              <tbody className="divide-y divide-gray-200">
                <tr className="bg-blue-50">
                  <td className="px-4 py-3 font-bold text-gray-900" colSpan="2">OPERATING ACTIVITIES</td>
                  <td className="px-4 py-3 text-right"></td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-gray-700">Net Profit</td>
                  <td className="px-4 py-2 text-right text-gray-900"></td>
                  <td className="px-4 py-2 text-right font-semibold text-gray-900">
                    ₹{reportData.netProfit.toLocaleString('en-IN')}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-gray-700">Cash from Sales</td>
                  <td className="px-4 py-2 text-right text-gray-900"></td>
                  <td className="px-4 py-2 text-right font-semibold text-gray-900">
                    ₹{reportData.totalSales.toLocaleString('en-IN')}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-gray-700">Cash for Purchases</td>
                  <td className="px-4 py-2 text-right text-gray-900"></td>
                  <td className="px-4 py-2 text-right font-semibold text-red-600">
                    -₹{reportData.totalPurchases.toLocaleString('en-IN')}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-gray-700">Cash for Expenses</td>
                  <td className="px-4 py-2 text-right text-gray-900"></td>
                  <td className="px-4 py-2 text-right font-semibold text-red-600">
                    -₹{reportData.totalExpenses.toLocaleString('en-IN')}
                  </td>
                </tr>
                <tr className="bg-gray-100">
                  <td className="px-4 py-4 font-bold text-gray-900" colSpan="2">NET CASH FLOW</td>
                  <td className={`px-4 py-4 text-right font-bold ${reportData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{reportData.netProfit.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default Reports
