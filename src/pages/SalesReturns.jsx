import { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { supabase } from '../lib/supabase'
import { Plus, Search, Edit2, Trash2, X, RotateCcw, Copy, Calendar } from 'lucide-react'
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns'

function SalesReturns() {
  const { user } = useUser()
  const [returns, setReturns] = useState([])
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    sale_id: '',
    order_id: '',
    invoice_number: '',
    customer_name: '',
    platform: '',
    product_name: '',
    quantity: 1,
    unit_price: 0,
    gst_percentage: 18,
    amount: 0,
    gst_amount: 0,
    total_amount: 0,
    return_shipping_fee: 0,
    refund_amount: 0,
    claim_amount: 0,
    claim_status: 'No Claim',
    net_loss: 0,
    reason: '',
    notes: ''
  })

  useEffect(() => {
    fetchReturns()
    fetchSales()
  }, [])

  useEffect(() => {
    // Auto-calculate amounts
    const baseAmount = formData.quantity * formData.unit_price
    const gstAmount = (baseAmount * formData.gst_percentage) / 100
    const totalAmount = baseAmount + gstAmount
    const shippingFee = formData.return_shipping_fee || 0
    const netRefund = totalAmount - shippingFee
    
    // Calculate net loss/profit
    // If claim approved: Net = Claim - Shipping Fee (can be positive/negative)
    // If no claim: Net Loss = -Shipping Fee
    const claimAmount = formData.claim_amount || 0
    const netLoss = claimAmount > 0 ? (claimAmount - shippingFee) : (shippingFee * -1)
    
    setFormData(prev => ({
      ...prev,
      amount: parseFloat(baseAmount.toFixed(2)),
      gst_amount: parseFloat(gstAmount.toFixed(2)),
      total_amount: parseFloat(totalAmount.toFixed(2)),
      refund_amount: parseFloat(netRefund.toFixed(2)),
      net_loss: parseFloat(netLoss.toFixed(2))
    }))
  }, [formData.quantity, formData.unit_price, formData.gst_percentage, formData.return_shipping_fee, formData.claim_amount])

  const fetchReturns = async () => {
    try {
      if (!user) return
      
      const { data, error } = await supabase
        .from('sales_returns')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })

      if (error) throw error
      setReturns(data || [])
    } catch (error) {
      console.error('Error fetching returns:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSales = async () => {
    try {
      if (!user) return
      
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(100)

      if (error) throw error
      setSales(data || [])
    } catch (error) {
      console.error('Error fetching sales:', error)
    }
  }

  const handleSaleSelect = (e) => {
    const saleId = e.target.value
    const sale = sales.find(s => s.id === saleId)
    
    if (sale) {
      setFormData({
        ...formData,
        sale_id: saleId,
        order_id: sale.order_id || '',
        invoice_number: sale.invoice_number || '',
        customer_name: sale.customer_name || '',
        platform: sale.platform || '',
        product_name: sale.product_name || '',
        quantity: sale.quantity || 1,
        unit_price: sale.unit_price || 0,
        gst_percentage: sale.gst_percentage || 18,
        amount: sale.amount || 0,
        gst_amount: sale.gst_amount || 0,
        total_amount: sale.total_amount || 0,
        refund_amount: sale.total_amount || 0
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.order_id) {
      alert('Order ID is required for reconciliation!')
      return
    }
    
    try {
      if (!user) {
        alert('You must be logged in')
        return
      }
      
      // Step 1: Save/Update the return
      let returnId = editingId
      if (editingId) {
        const { error } = await supabase
          .from('sales_returns')
          .update({ ...formData, user_id: user.id })
          .eq('id', editingId)
        
        if (error) throw error
      } else {
        // Check if this order_id already has a return
        const { data: existingReturns, error: checkError } = await supabase
          .from('sales_returns')
          .select('id')
          .eq('order_id', formData.order_id)
          .eq('user_id', user.id)
        
        if (checkError) throw checkError
        
        if (existingReturns && existingReturns.length > 0) {
          alert(`Order ID "${formData.order_id}" already has a return entry! Each order can only have one return.`)
          return
        }
        
        const { data: newReturn, error } = await supabase
          .from('sales_returns')
          .insert([{ ...formData, user_id: user.id }])
          .select()
        
        if (error) throw error
        returnId = newReturn[0].id
      }

      // Step 2: Find matching sale by order_id and mark as returned
      const { data: matchingSales, error: salesError } = await supabase
        .from('sales')
        .select('*')
        .eq('order_id', formData.order_id)
        .eq('user_id', user.id)
      
      if (salesError) throw salesError
      
      if (matchingSales && matchingSales.length > 0) {
        const sale = matchingSales[0]
        
        // Mark sale as returned (set returned flag)
        const { error: updateSaleError } = await supabase
          .from('sales')
          .update({ 
            is_returned: true,
            return_id: returnId
          })
          .eq('id', sale.id)
        
        if (updateSaleError) throw updateSaleError
        
        // Step 3: Handle inventory based on claim status
        // Only add stock back if NO claim (item physically returned)
        // If claim exists (approved/rejected), item is lost/wrong, don't add stock
        if (formData.claim_status === 'No Claim') {
          // Add stock back - normal return
          const { data: inventoryItems, error: invError } = await supabase
            .from('inventory')
            .select('*')
            .ilike('product_name', formData.product_name)
            .eq('user_id', user.id)
            .limit(1)
          
          if (invError) throw invError
          
          if (inventoryItems && inventoryItems.length > 0) {
            // Update existing inventory
            const item = inventoryItems[0]
            const currentStock = Number(item.current_stock) || 0
            const qty = Number(formData.quantity) || 0
            const { error: updateInvError } = await supabase
              .from('inventory')
              .update({ 
                current_stock: currentStock + qty
              })
              .eq('id', item.id)
            
            if (updateInvError) throw updateInvError
          }
          // If no inventory record exists, we can create one (optional)
        }
        // If claim exists, don't touch inventory (item lost/damaged)
      }

      resetForm()
      fetchReturns()
      alert('Return processed successfully! ' + 
        (formData.claim_status === 'No Claim' 
          ? 'Stock has been added back.' 
          : 'Stock not added (claim case - item lost/wrong).'))
    } catch (error) {
      console.error('Error saving return:', error)
      alert('Error saving return: ' + error.message)
    }
  }

  const handleEdit = (returnItem) => {
    setFormData({
      date: returnItem.date,
      sale_id: returnItem.sale_id || '',
      order_id: returnItem.order_id || '',
      invoice_number: returnItem.invoice_number || '',
      customer_name: returnItem.customer_name || '',
      platform: returnItem.platform || '',
      product_name: returnItem.product_name || '',
      quantity: returnItem.quantity || 1,
      unit_price: returnItem.unit_price || 0,
      gst_percentage: returnItem.gst_percentage || 18,
      amount: returnItem.amount || 0,
      gst_amount: returnItem.gst_amount || 0,
      total_amount: returnItem.total_amount || 0,
      return_shipping_fee: returnItem.return_shipping_fee || 0,
      refund_amount: returnItem.refund_amount || 0,
      claim_amount: returnItem.claim_amount || 0,
      claim_status: returnItem.claim_status || 'No Claim',
      net_loss: returnItem.net_loss || 0,
      reason: returnItem.reason || '',
      notes: returnItem.notes || ''
    })
    setEditingId(returnItem.id)
    setShowForm(true)
  }

  const handleDuplicate = (returnItem) => {
    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      sale_id: returnItem.sale_id || '',
      order_id: '', // Clear order_id for new return
      invoice_number: returnItem.invoice_number || '',
      customer_name: returnItem.customer_name || '',
      platform: returnItem.platform || '',
      product_name: returnItem.product_name || '',
      quantity: returnItem.quantity || 1,
      unit_price: returnItem.unit_price || 0,
      gst_percentage: returnItem.gst_percentage || 18,
      amount: returnItem.amount || 0,
      gst_amount: returnItem.gst_amount || 0,
      total_amount: returnItem.total_amount || 0,
      return_shipping_fee: returnItem.return_shipping_fee || 0,
      refund_amount: returnItem.refund_amount || 0,
      claim_amount: returnItem.claim_amount || 0,
      claim_status: returnItem.claim_status || 'No Claim',
      net_loss: returnItem.net_loss || 0,
      reason: returnItem.reason || '',
      notes: returnItem.notes || ''
    })
    setEditingId(null)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this return? This will reverse the return and restore the original sale.')) return

    try {
      if (!user) {
        alert('You must be logged in')
        return
      }
      
      // Step 1: Get the return record before deleting
      const { data: returnRecord, error: fetchError } = await supabase
        .from('sales_returns')
        .select('*')
        .eq('id', id)
        .single()
      
      if (fetchError) throw fetchError
      
      // Step 2: Find and restore the associated sale
      if (returnRecord.order_id) {
        const { data: matchingSales, error: salesError } = await supabase
          .from('sales')
          .select('*')
          .eq('order_id', returnRecord.order_id)
          .eq('user_id', user.id)
        
        if (salesError) throw salesError
        
        if (matchingSales && matchingSales.length > 0) {
          // Restore sale (unmark as returned)
          const { error: restoreSaleError } = await supabase
            .from('sales')
            .update({ 
              is_returned: false,
              return_id: null
            })
            .eq('id', matchingSales[0].id)
          
          if (restoreSaleError) throw restoreSaleError
          
          // Step 3: Reverse inventory changes if it was a "No Claim" return
          if (returnRecord.claim_status === 'No Claim') {
            const { data: inventoryItems, error: invError } = await supabase
              .from('inventory')
              .select('*')
              .ilike('product_name', returnRecord.product_name)
              .eq('user_id', user.id)
              .limit(1)
            
            if (invError) throw invError
            
            if (inventoryItems && inventoryItems.length > 0) {
              const item = inventoryItems[0]
              // Subtract the quantity that was added back
              const currentStock = Number(item.current_stock) || 0
              const qty = Number(returnRecord.quantity) || 0
              const { error: updateInvError } = await supabase
                .from('inventory')
                .update({ 
                  current_stock: Math.max(0, currentStock - qty)
                })
                .eq('id', item.id)
              
              if (updateInvError) throw updateInvError
            }
          }
        }
      }
      
      // Step 4: Delete the return record
      const { error: deleteError } = await supabase
        .from('sales_returns')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError
      
      fetchReturns()
      alert('Return deleted successfully! Sale has been restored.' +
        (returnRecord.claim_status === 'No Claim' 
          ? ' Stock has been adjusted back.' 
          : ''))
    } catch (error) {
      console.error('Error deleting return:', error)
      alert('Error deleting return: ' + error.message)
    }
  }

  const resetForm = () => {
    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      sale_id: '',
      order_id: '',
      invoice_number: '',
      customer_name: '',
      platform: '',
      product_name: '',
      quantity: 1,
      unit_price: 0,
      gst_percentage: 18,
      amount: 0,
      gst_amount: 0,
      total_amount: 0,
      return_shipping_fee: 0,
      refund_amount: 0,
      claim_amount: 0,
      claim_status: 'No Claim',
      net_loss: 0,
      reason: '',
      notes: ''
    })
    setEditingId(null)
    setShowForm(false)
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

  const filteredReturns = returns.filter(ret => {
    const matchesSearch = ret.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ret.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ret.product_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDate = isWithinDateFilter(ret.date)
    return matchesSearch && matchesDate
  })

  // Calculate reconciliation summary (cast NUMERIC strings to numbers)
  const totalReturnAmount = filteredReturns.reduce((sum, ret) => sum + (Number(ret.total_amount) || 0), 0)
  const totalShippingFees = filteredReturns.reduce((sum, ret) => sum + (Number(ret.return_shipping_fee) || 0), 0)
  const totalClaimAmount = filteredReturns.reduce((sum, ret) => sum + (Number(ret.claim_amount) || 0), 0)
  const netLoss = filteredReturns.reduce((sum, ret) => sum + (Number(ret.net_loss) || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sales Returns</h2>
          <p className="text-gray-600">Manage product returns and refunds</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition"
        >
          <Plus className="w-5 h-5" />
          <span>Add Return</span>
        </button>
      </div>

      {/* Search and Stats */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search returns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>
          <div className="space-y-2">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
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
        
        {/* Reconciliation Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <p className="text-xs text-red-600 mb-1 font-medium">Total Returns</p>
            <p className="text-xl font-bold text-red-700">₹{totalReturnAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</p>
          </div>
          
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <p className="text-xs text-orange-600 mb-1 font-medium">Shipping Fees</p>
            <p className="text-xl font-bold text-orange-700">₹{totalShippingFees.toLocaleString('en-IN', {minimumFractionDigits: 2})}</p>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-xs text-blue-600 mb-1 font-medium">Claim Refunds</p>
            <p className="text-xl font-bold text-blue-700">₹{totalClaimAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</p>
          </div>
          
          <div className={`rounded-lg p-4 border-2 ${
            netLoss >= 0 
              ? 'bg-green-50 border-green-300' 
              : 'bg-red-50 border-red-300'
          }`}>
            <p className={`text-xs mb-1 font-medium ${
              netLoss >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {netLoss >= 0 ? '✅ Net Profit' : '❌ Net Loss'}
            </p>
            <p className={`text-2xl font-bold ${
              netLoss >= 0 ? 'text-green-700' : 'text-red-700'
            }`}>
              ₹{Math.abs(netLoss).toLocaleString('en-IN', {minimumFractionDigits: 2})}
            </p>
          </div>
        </div>
      </div>

      {/* Returns Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Refund</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    Loading returns...
                  </td>
                </tr>
              ) : filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    <RotateCcw className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No returns found</p>
                  </td>
                </tr>
              ) : (
                filteredReturns.map((returnItem) => (
                  <tr key={returnItem.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(returnItem.date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {returnItem.customer_name}
                      {returnItem.invoice_number && (
                        <p className="text-xs text-gray-500">{returnItem.invoice_number}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{returnItem.product_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{returnItem.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                      ₹{returnItem.refund_amount?.toLocaleString('en-IN', {minimumFractionDigits: 2})}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{returnItem.reason || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(returnItem)}
                          className="text-primary hover:text-primary/80"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(returnItem)}
                          className="text-green-600 hover:text-green-800"
                          title="Duplicate"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(returnItem.id)}
                          className="text-red-600 hover:text-red-800"
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

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">
                {editingId ? 'Edit Return' : 'Add Sales Return'}
              </h3>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Return Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Original Sale (Optional)
                  </label>
                  <select
                    value={formData.sale_id}
                    onChange={handleSaleSelect}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  >
                    <option value="">Manual entry</option>
                    {sales.map(sale => (
                      <option key={sale.id} value={sale.id}>
                        {sale.invoice_number || sale.customer_name} - {sale.product_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Order ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.order_id}
                    onChange={(e) => setFormData({...formData, order_id: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    placeholder="Platform order ID (for reconciliation)"
                  />
                  <p className="text-xs text-gray-500 mt-1">🔗 Links return to original sale</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Invoice Number
                  </label>
                  <input
                    type="text"
                    value={formData.invoice_number}
                    onChange={(e) => setFormData({...formData, invoice_number: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Platform
                  </label>
                  <select
                    value={formData.platform}
                    onChange={(e) => setFormData({...formData, platform: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  >
                    <option value="">Select platform</option>
                    <option value="Meesho">Meesho</option>
                    <option value="Amazon">Amazon</option>
                    <option value="Flipkart">Flipkart</option>
                    <option value="Myntra">Myntra</option>
                    <option value="Offline">Offline</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.product_name}
                    onChange={(e) => setFormData({...formData, product_name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 1})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formData.unit_price}
                    onChange={(e) => setFormData({...formData, unit_price: parseFloat(e.target.value) || 0})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GST %
                  </label>
                  <select
                    value={formData.gst_percentage}
                    onChange={(e) => setFormData({...formData, gst_percentage: parseFloat(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  >
                    <option value="0">0%</option>
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                    <option value="28">28%</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Return Shipping Fee (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.return_shipping_fee}
                    onChange={(e) => setFormData({...formData, return_shipping_fee: parseFloat(e.target.value) || 0})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    placeholder="Charged by Meesho/Amazon"
                  />
                  <p className="text-xs text-gray-500 mt-1">Platform charges (auto-deducted from refund)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Net Refund Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.refund_amount}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Auto-calculated: Total - Shipping Fee</p>
                </div>

                {/* Wrong Return Claim Section */}
                <div className="md:col-span-2 border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    ⚖️ Wrong Return Claim (If Applicable)
                  </h4>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Claim Status
                  </label>
                  <select
                    value={formData.claim_status}
                    onChange={(e) => setFormData({...formData, claim_status: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  >
                    <option value="No Claim">No Claim</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">For wrong return claims raised with platform</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Claim Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.claim_amount}
                    onChange={(e) => setFormData({...formData, claim_amount: parseFloat(e.target.value) || 0})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    placeholder="Amount received if claim approved"
                  />
                  <p className="text-xs text-gray-500 mt-1">Refund from platform (shipping fee already adjusted)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Return Reason
                  </label>
                  <select
                    value={formData.reason}
                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  >
                    <option value="">Select reason</option>
                    <option value="Defective Product">Defective Product</option>
                    <option value="Wrong Item Sent">Wrong Item Sent</option>
                    <option value="Size/Fit Issue">Size/Fit Issue</option>
                    <option value="Customer Changed Mind">Customer Changed Mind</option>
                    <option value="Damaged in Transit">Damaged in Transit</option>
                    <option value="Quality Issues">Quality Issues</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows="2"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
                    placeholder="Additional notes..."
                  />
                </div>
              </div>

              {/* Amount Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Base Amount:</span>
                  <span className="font-medium">₹{formData.amount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">GST ({formData.gst_percentage}%):</span>
                  <span className="font-medium">₹{formData.gst_amount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold border-t border-gray-200 pt-2">
                  <span>Total Return Amount:</span>
                  <span className="text-gray-900">₹{formData.total_amount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                </div>
                {formData.return_shipping_fee > 0 && (
                  <div className="flex justify-between text-sm text-orange-600">
                    <span>(-) Return Shipping Fee:</span>
                    <span>₹{formData.return_shipping_fee.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-gray-700 border-t border-gray-200 pt-2">
                  <span>Net Refund to Customer:</span>
                  <span>₹{formData.refund_amount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                </div>
                
                {/* Reconciliation Section */}
                <div className="border-t-2 border-gray-300 pt-2 mt-2">
                  <p className="text-xs font-semibold text-gray-600 mb-2">📊 Reconciliation:</p>
                  {formData.claim_amount > 0 && (
                    <div className="flex justify-between text-sm text-blue-600">
                      <span>(+) Claim Amount:</span>
                      <span>₹{formData.claim_amount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                    </div>
                  )}
                  <div className={`flex justify-between text-lg font-bold ${formData.net_loss >= 0 ? 'text-green-600' : 'text-red-600'} border-t border-gray-300 pt-2 mt-2`}>
                    <span>{formData.net_loss >= 0 ? 'Net Profit:' : 'Net Loss:'}</span>
                    <span>₹{Math.abs(formData.net_loss).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 italic">
                    {formData.claim_amount > 0 
                      ? `Claim ₹${formData.claim_amount.toFixed(2)} - Shipping ₹${formData.return_shipping_fee.toFixed(2)} = ${formData.net_loss >= 0 ? 'Profit' : 'Loss'} ₹${Math.abs(formData.net_loss).toFixed(2)}`
                      : `Loss = Shipping Fee ₹${formData.return_shipping_fee.toFixed(2)}`
                    }
                  </p>
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
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
                >
                  {editingId ? 'Update Return' : 'Add Return'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default SalesReturns
