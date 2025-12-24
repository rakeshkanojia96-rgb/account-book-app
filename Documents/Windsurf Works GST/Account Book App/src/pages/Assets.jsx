import { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { supabase } from '../lib/supabase'
import { Plus, Search, Edit2, Trash2, X, Laptop, Copy, Calendar } from 'lucide-react'
import { format, differenceInMonths, parse, isValid, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import * as XLSX from 'xlsx'

function Assets() {
  const { user } = useUser()
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  
  const [formData, setFormData] = useState({
    asset_name: '',
    category: 'Computer',
    purchase_date: format(new Date(), 'yyyy-MM-dd'),
    purchase_price: 0,
    gst_percentage: 18,
    gst_amount: 0,
    total_cost: 0,
    depreciation_method: 'Straight Line',
    depreciation_rate: 10,
    useful_life_years: 5,
    current_value: 0,
    accumulated_depreciation: 0,
    notes: ''
  })

  useEffect(() => {
    fetchAssets()
  }, [])

  useEffect(() => {
    // Auto-calculate GST and total cost (ensure numeric values)
    const purchasePrice = Number(formData.purchase_price) || 0
    const gstPercentage = Number(formData.gst_percentage) || 0

    const gstAmount = purchasePrice * (gstPercentage / 100)
    const totalCost = purchasePrice + gstAmount
    
    setFormData(prev => ({
      ...prev,
      gst_amount: gstAmount,
      total_cost: totalCost
    }))
  }, [formData.purchase_price, formData.gst_percentage])

  const calculateDepreciation = (asset) => {
    const months = differenceInMonths(new Date(), new Date(asset.purchase_date))
    const years = months / 12

    if (asset.depreciation_method === 'Straight Line') {
      const annualDepreciation = asset.purchase_price / asset.useful_life_years
      const totalDepreciation = Math.min(annualDepreciation * years, asset.purchase_price)
      return {
        accumulated_depreciation: totalDepreciation,
        current_value: asset.purchase_price - totalDepreciation
      }
    } else if (asset.depreciation_method === 'Written Down Value') {
      let currentValue = asset.purchase_price
      const monthlyRate = asset.depreciation_rate / 12 / 100
      
      for (let i = 0; i < months; i++) {
        currentValue -= currentValue * monthlyRate
      }
      
      return {
        accumulated_depreciation: asset.purchase_price - currentValue,
        current_value: currentValue
      }
    }
    
    return { accumulated_depreciation: 0, current_value: asset.purchase_price }
  }

  const fetchAssets = async () => {
    try {
      if (!user) return
      
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('user_id', user.id)
        .order('purchase_date', { ascending: false })

      if (error) throw error
      
      // Calculate current depreciation for all assets
      const assetsWithDepreciation = (data || []).map(asset => {
        const { accumulated_depreciation, current_value } = calculateDepreciation(asset)
        return { ...asset, accumulated_depreciation, current_value }
      })
      
      setAssets(assetsWithDepreciation)
    } catch (error) {
      console.error('Error fetching assets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      if (!user) {
        alert('You must be logged in')
        return
      }
      const { accumulated_depreciation, current_value } = calculateDepreciation(formData)

      // Map frontend fields to Neon assets schema
      const assetData = {
        user_id: user.id,
        name: formData.asset_name,
        category: formData.category,
        purchase_date: formData.purchase_date,
        purchase_price: formData.purchase_price,
        gst_percentage: formData.gst_percentage,
        depreciation_method: formData.depreciation_method,
        depreciation_rate: formData.depreciation_method === 'Written Down Value'
          ? formData.depreciation_rate
          : null,
        useful_life_years: formData.depreciation_method === 'Straight Line'
          ? formData.useful_life_years
          : null,
        notes: formData.notes,
        current_value
      }
      
      if (editingId) {
        const { error } = await supabase
          .from('assets')
          .update(assetData)
          .eq('id', editingId)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('assets')
          .insert([assetData])
        
        if (error) throw error
      }

      resetForm()
      fetchAssets()
    } catch (error) {
      console.error('Error saving asset:', error)
      alert('Error saving asset: ' + error.message)
    }
  }

  const handleEdit = (asset) => {
    const price = Number(asset.purchase_price) || 0
    const gstPercentage = asset.gst_percentage !== undefined && asset.gst_percentage !== null
      ? Number(asset.gst_percentage) || 0
      : 18

    const gstAmount = price * (gstPercentage / 100)
    const totalCost = price + gstAmount

    setFormData({
      asset_name: asset.name || '',
      category: asset.category || 'Computer',
      // Ensure date is in yyyy-MM-dd format for the date input
      purchase_date: asset.purchase_date
        ? format(new Date(asset.purchase_date), 'yyyy-MM-dd')
        : format(new Date(), 'yyyy-MM-dd'),
      purchase_price: price,
      gst_percentage: gstPercentage,
      gst_amount: gstAmount,
      total_cost: totalCost,
      depreciation_method: asset.depreciation_method || 'Straight Line',
      depreciation_rate: asset.depreciation_rate || 10,
      useful_life_years: asset.useful_life_years || 5,
      current_value: asset.current_value || 0,
      accumulated_depreciation: calculateDepreciation(asset).accumulated_depreciation,
      notes: asset.notes || ''
    })
    setEditingId(asset.id)
    setShowForm(true)
  }

  const handleDuplicate = (asset) => {
    const price = Number(asset.purchase_price) || 0
    const gstPercentage = asset.gst_percentage !== undefined && asset.gst_percentage !== null
      ? Number(asset.gst_percentage) || 0
      : 18

    const gstAmount = price * (gstPercentage / 100)
    const totalCost = price + gstAmount

    setFormData({
      asset_name: asset.name || '',
      category: asset.category || 'Computer',
      purchase_date: format(new Date(), 'yyyy-MM-dd'),
      purchase_price: price,
      gst_percentage: gstPercentage,
      gst_amount: gstAmount,
      total_cost: totalCost,
      depreciation_method: asset.depreciation_method || 'Straight Line',
      depreciation_rate: asset.depreciation_rate || 10,
      useful_life_years: asset.useful_life_years || 5,
      current_value: asset.current_value || 0,
      accumulated_depreciation: 0, // Reset for new asset
      notes: asset.notes || ''
    })
    setEditingId(null)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this asset?')) return

    try {
      const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchAssets()
    } catch (error) {
      console.error('Error deleting asset:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      asset_name: '',
      category: 'Computer',
      purchase_date: format(new Date(), 'yyyy-MM-dd'),
      purchase_price: 0,
      gst_percentage: 18,
      gst_amount: 0,
      total_cost: 0,
      depreciation_method: 'Straight Line',
      depreciation_rate: 10,
      useful_life_years: 5,
      current_value: 0,
      accumulated_depreciation: 0,
      notes: ''
    })
    setEditingId(null)
    setShowForm(false)
  }

  const parseCsvDate = (value) => {
    if (value === undefined || value === null || value === '') return null

    // Already a Date
    if (value instanceof Date && isValid(value)) {
      return format(value, 'yyyy-MM-dd')
    }

    // Excel serial number
    if (typeof value === 'number') {
      if (value > 20000 && value < 60000) {
        const excelEpoch = new Date(Date.UTC(1899, 11, 30))
        const ms = excelEpoch.getTime() + value * 24 * 60 * 60 * 1000
        const d = new Date(ms)
        if (isValid(d)) return format(d, 'yyyy-MM-dd')
      }

      const d2 = new Date(value)
      if (isValid(d2)) return format(d2, 'yyyy-MM-dd')
    }

    // String formats
    let str = String(value).trim()
    str = str.replace(/\./g, '-').replace(/\//g, '-')

    const patterns = [
      'dd-MM-yyyy',
      'd-M-yyyy',
      'dd-MMM-yyyy',
      'd-MMM-yyyy',
      'yyyy-MM-dd'
    ]

    for (const pattern of patterns) {
      const parsed = parse(str, pattern, new Date())
      if (isValid(parsed)) {
        return format(parsed, 'yyyy-MM-dd')
      }
    }

    return null
  }

  const handleDownloadTemplate = () => {
    const headers = [
      'asset_name',
      'category',
      'purchase_date',
      'purchase_price',
      'gst_percentage',
      'depreciation_method',
      'depreciation_rate',
      'useful_life_years',
      'notes'
    ]

    const sampleRow = [
      'HP Laptop',
      'Computer',
      '28-01-2023',
      '50000',
      '18',
      'Straight Line',
      '',
      '5',
      'Office laptop purchase (date format dd-mm-yyyy)'
    ]

    const escapeCsv = (val) => {
      const str = String(val ?? '')
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"'
      }
      return str
    }

    const csvContent =
      headers.join(',') + '\n' +
      sampleRow.map(escapeCsv).join(',') + '\n'

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'assets_template.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleUploadCSV = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!user) {
      alert('You must be logged in to upload CSVs')
      event.target.value = ''
      return
    }

    try {
      setLoading(true)

      const rows = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const data = e.target?.result
            const workbook = XLSX.read(data, { type: 'binary' })
            const sheetName = workbook.SheetNames[0]
            const worksheet = workbook.Sheets[sheetName]
            const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' })
            resolve(json)
          } catch (err) {
            reject(err)
          }
        }
        reader.onerror = (err) => reject(err)
        reader.readAsBinaryString(file)
      })

      const requiredColumns = [
        'asset_name',
        'purchase_date',
        'purchase_price'
      ]

      if (!Array.isArray(rows) || rows.length === 0) {
        alert('CSV file is empty or could not be read.')
        return
      }

      const missingCols = requiredColumns.filter((col) => !(col in rows[0]))
      if (missingCols.length > 0) {
        alert('CSV is missing required columns: ' + missingCols.join(', '))
        return
      }

      let successCount = 0
      let errorCount = 0
      const rowErrors = []

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        try {
          const name = String(row.asset_name || '').trim()
          if (!name) {
            throw new Error('asset_name is required')
          }

          const dbDate = parseCsvDate(row.purchase_date)
          if (!dbDate) {
            const raw = row.purchase_date
            throw new Error(
              `Invalid purchase_date format for "${raw}" (type ${typeof raw}). Use dd-mm-yyyy or dd-MMM-yyyy (e.g. 11-03-2023 or 11-Mar-2023)`
            )
          }

          const purchasePrice = Number(row.purchase_price)
          if (Number.isNaN(purchasePrice) || purchasePrice < 0) {
            throw new Error('purchase_price must be a non-negative number')
          }

          const rawGst = row.gst_percentage === undefined || row.gst_percentage === null
            ? ''
            : String(row.gst_percentage).trim().replace('%', '')

          let gstPercentage = rawGst === '' ? 0 : Number(rawGst)
          if (!Number.isNaN(gstPercentage) && gstPercentage > 0 && gstPercentage <= 1) {
            gstPercentage = gstPercentage * 100
          }

          let depreciationMethod = String(row.depreciation_method || '').trim()
          if (!depreciationMethod) {
            depreciationMethod = 'Straight Line'
          }

          const isStraightLine = depreciationMethod === 'Straight Line'
          const isWDV = depreciationMethod === 'Written Down Value'

          let depreciationRate = null
          let usefulLifeYears = null

          if (isStraightLine) {
            usefulLifeYears = row.useful_life_years === undefined || row.useful_life_years === null
              ? 5
              : Number(row.useful_life_years)
            if (Number.isNaN(usefulLifeYears) || usefulLifeYears <= 0) {
              usefulLifeYears = 5
            }
          } else if (isWDV) {
            depreciationRate = row.depreciation_rate === undefined || row.depreciation_rate === null
              ? 10
              : Number(row.depreciation_rate)
            if (Number.isNaN(depreciationRate) || depreciationRate <= 0 || depreciationRate > 100) {
              depreciationRate = 10
            }
          } else {
            // Unknown method -> treat as Straight Line with default 5 years
            depreciationMethod = 'Straight Line'
            usefulLifeYears = 5
          }

          const assetForCalc = {
            purchase_date: dbDate,
            purchase_price: purchasePrice,
            depreciation_method: depreciationMethod,
            depreciation_rate: depreciationRate || 10,
            useful_life_years: usefulLifeYears || 5
          }

          const { current_value } = calculateDepreciation(assetForCalc)

          const assetData = {
            user_id: user.id,
            name,
            category: row.category || 'Computer',
            purchase_date: dbDate,
            purchase_price: purchasePrice,
            gst_percentage: gstPercentage,
            depreciation_method: depreciationMethod,
            depreciation_rate: isWDV ? depreciationRate : null,
            useful_life_years: isStraightLine ? usefulLifeYears : null,
            notes: row.notes || '',
            current_value
          }

          const { error: insertError } = await supabase
            .from('assets')
            .insert([assetData])

          if (insertError) throw insertError

          successCount++
        } catch (rowError) {
          console.error('Error importing asset row', i + 2, rowError)
          rowErrors.push({
            rowNumber: i + 2,
            message: rowError?.message || String(rowError)
          })
          errorCount++
        }
      }

      let message = `Assets CSV import complete. Imported: ${successCount}, Failed: ${errorCount}`

      if (rowErrors.length > 0) {
        const preview = rowErrors
          .slice(0, 5)
          .map((e) => `Row ${e.rowNumber}: ${e.message}`)
          .join('\n')
        message += `\n\nDetails (first ${Math.min(5, rowErrors.length)} errors):\n${preview}`
        if (rowErrors.length > 5) {
          message += `\n...and ${rowErrors.length - 5} more.`
        }
      }

      alert(message)
      fetchAssets()
    } catch (error) {
      console.error('Error processing assets CSV:', error)
      alert('Error processing CSV: ' + error.message)
    } finally {
      setLoading(false)
      event.target.value = ''
    }
  }

  const isWithinDateFilter = (dateStr) => {
    if (dateFilter === 'all') return true
    if (!dateStr) return false

    const date = new Date(dateStr)
    if (Number.isNaN(date.getTime())) return false

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    let from = null
    let to = today

    switch (dateFilter) {
      case 'last_30_days':
        from = subDays(today, 30)
        break
      case 'last_60_days':
        from = subDays(today, 60)
        break
      case 'last_90_days':
        from = subDays(today, 90)
        break
      case 'this_month':
        from = startOfMonth(today)
        break
      case 'last_month': {
        const lastMonthDate = subMonths(today, 1)
        from = startOfMonth(lastMonthDate)
        to = endOfMonth(lastMonthDate)
        break
      }
      case 'custom': {
        if (!customStartDate && !customEndDate) return true
        from = customStartDate ? new Date(customStartDate) : null
        to = customEndDate ? new Date(customEndDate) : null
        break
      }
      default:
        return true
    }

    if (from && date < from) return false
    if (to && date > to) return false
    return true
  }

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = (asset.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDate = isWithinDateFilter(asset.purchase_date)
    return matchesSearch && matchesDate
  })

  const getAssetTotalCost = (asset) => {
    const price = Number(asset.purchase_price) || 0
    const gstPercent = asset.gst_percentage !== undefined && asset.gst_percentage !== null
      ? Number(asset.gst_percentage) || 0
      : 18
    return price + price * (gstPercent / 100)
  }

  const totalPurchaseValue = filteredAssets.reduce(
    (sum, asset) => sum + getAssetTotalCost(asset),
    0
  )
  const totalCurrentValue = filteredAssets.reduce(
    (sum, asset) => sum + (Number(asset.current_value) || 0),
    0
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Assets</h2>
          <p className="text-gray-600">Manage assets and depreciation</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm"
          >
            Download CSV Template
          </button>
          <label className="inline-flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm cursor-pointer">
            <input
              type="file"
              accept=".csv"
              onChange={handleUploadCSV}
              className="hidden"
            />
            Upload CSV
          </label>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Asset
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600 mb-2">Total Assets</p>
          <p className="text-3xl font-bold text-gray-900">{filteredAssets.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600 mb-2">Purchase Value</p>
          <p className="text-3xl font-bold text-gray-900">₹{totalPurchaseValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600 mb-2">Current Value</p>
          <p className="text-3xl font-bold text-purple-600">₹{totalCurrentValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>
          <div className="space-y-2">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              >
                <option value="all">All Time</option>
                <option value="last_30_days">Last 30 days</option>
                <option value="last_60_days">Last 60 days</option>
                <option value="last_90_days">Last 90 days</option>
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
            {dateFilter === 'custom' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-xs"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asset Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purchase Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Purchase Price</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Cost</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Depreciation</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Current Value</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center text-gray-500">
                    No assets found. Add your first asset!
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{asset.name}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                        {asset.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{format(new Date(asset.purchase_date), 'dd MMM yyyy')}</td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900">₹{(Number(asset.purchase_price) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900">₹{getAssetTotalCost(asset).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{asset.depreciation_method}</td>
                    <td className="px-6 py-4 text-sm text-right text-red-600">₹{(Number(asset.accumulated_depreciation) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4 text-sm text-right font-semibold text-purple-600">₹{(Number(asset.current_value) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleEdit(asset)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(asset)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="Duplicate"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(asset.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                {editingId ? 'Edit Asset' : 'Add New Asset'}
              </h3>
              <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Asset Name *</label>
                  <input
                    type="text"
                    value={formData.asset_name}
                    onChange={(e) => setFormData({...formData, asset_name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    placeholder="HP Laptop"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    required
                  >
                    <option value="Computer">Computer/Laptop</option>
                    <option value="Printer">Printer</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Vehicle">Vehicle</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Purchase Date *</label>
                  <input
                    type="date"
                    value={formData.purchase_date}
                    onChange={(e) => setFormData({...formData, purchase_date: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Purchase Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.purchase_price}
                    onChange={(e) => setFormData({...formData, purchase_price: parseFloat(e.target.value) || 0})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">GST % (Optional)</label>
                  <select
                    value={formData.gst_percentage}
                    onChange={(e) => setFormData({...formData, gst_percentage: parseFloat(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  >
                    <option value="0">0% (No GST)</option>
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18% (Standard)</option>
                    <option value="28">28%</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Depreciation Method</label>
                  <select
                    value={formData.depreciation_method}
                    onChange={(e) => setFormData({...formData, depreciation_method: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  >
                    <option value="Straight Line">Straight Line</option>
                    <option value="Written Down Value">Written Down Value (WDV)</option>
                  </select>
                </div>

                {formData.depreciation_method === 'Straight Line' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Useful Life (Years)</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.useful_life_years}
                      onChange={(e) => setFormData({...formData, useful_life_years: parseInt(e.target.value) || 5})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Depreciation Rate (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.depreciation_rate}
                      onChange={(e) => setFormData({...formData, depreciation_rate: parseFloat(e.target.value) || 10})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    />
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows="2"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
                    placeholder="Additional notes..."
                  />
                </div>
              </div>

              {/* Cost Summary */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Purchase Price:</span>
                  <span className="font-medium">₹{formData.purchase_price.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">GST ({formData.gst_percentage}%):</span>
                  <span className="font-medium">₹{formData.gst_amount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                  <span>Total Cost:</span>
                  <span className="text-purple-600">₹{formData.total_cost.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                  {editingId ? 'Update Asset' : 'Add Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Assets
