import { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { supabase } from '../lib/supabase'
import { Plus, Search, Filter, Edit2, Trash2, X, Copy } from 'lucide-react'
import { format } from 'date-fns'

function Purchases() {
  const { user } = useUser()
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    invoice_number: '',
    supplier_name: '',
    category: 'Raw Material',
    item_name: '',
    quantity: 1,
    unit_price: 0,
    gst_percentage: 18,
    amount: 0,
    gst_amount: 0,
    total_amount: 0,
    payment_method: 'Online',
    notes: ''
  })

  useEffect(() => {
    fetchPurchases()
  }, [])

  useEffect(() => {
    const amount = formData.quantity * formData.unit_price
    const gstAmount = amount * (formData.gst_percentage / 100)
    const totalAmount = amount + gstAmount
    
    setFormData(prev => ({
      ...prev,
      amount,
      gst_amount: gstAmount,
      total_amount: totalAmount
    }))
  }, [formData.quantity, formData.unit_price, formData.gst_percentage])

  const fetchPurchases = async () => {
    try {
      if (!user) return
      
      const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })

      if (error) throw error
      setPurchases(data || [])
    } catch (error) {
      console.error('Error fetching purchases:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      if (!user) {
        alert('You must be logged in to save purchases')
        return
      }
      
      if (editingId) {
        const { error } = await supabase
          .from('purchases')
          .update({ ...formData, user_id: user.id })
          .eq('id', editingId)
        
        if (error) throw error
      } else {
        // Insert new purchase
        const { error } = await supabase
          .from('purchases')
          .insert([{ ...formData, user_id: user.id }])
        
        if (error) throw error
      }
      
      // AUTO-UPDATE INVENTORY: Works for both NEW and EDITED purchases
      // Use case-insensitive search to find existing inventory
      const { data: inventoryItems, error: invError } = await supabase
        .from('inventory')
        .select('*')
        .ilike('product_name', formData.item_name)
        .eq('user_id', user.id)
        .limit(1)
      
      if (invError) throw invError
      
      if (inventoryItems && inventoryItems.length > 0) {
        // Update existing inventory (only for NEW purchases, not edits)
        if (!editingId) {
          const item = inventoryItems[0]
          
          const { error: updateInvError } = await supabase
            .from('inventory')
            .update({ 
              current_stock: item.current_stock + formData.quantity
            })
            .eq('id', item.id)
          
          if (updateInvError) throw updateInvError
          
          // Log stock movement
          await supabase.from('stock_movements').insert([{
            user_id: user.id,
            inventory_id: item.id,
            movement_type: 'IN',
            quantity: formData.quantity,
            reference_type: 'PURCHASE',
            notes: `Purchase from ${formData.supplier_name || 'Supplier'}`,
            movement_date: formData.date
          }])
        }
      } else {
        // Create new inventory item if it doesn't exist
        // Map fields to Neon inventory schema
        const { error: createInvError } = await supabase
          .from('inventory')
          .insert([{
            user_id: user.id,
            product_name: formData.item_name,
            category: formData.category,
            current_stock: formData.quantity,
            reorder_level: 5,
            unit_of_measure: 'Pieces'
          }])
        
        if (createInvError) throw createInvError
      }

      resetForm()
      fetchPurchases()
      alert(editingId ? 'Purchase updated!' : 'Purchase added! Stock updated automatically.')
    } catch (error) {
      console.error('Error saving purchase:', error)
      alert('Error saving purchase: ' + error.message)
    }
  }

  const handleEdit = (purchase) => {
    setFormData({
      // Ensure date is in yyyy-MM-dd format for the date input
      date: purchase.date ? format(new Date(purchase.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      invoice_number: purchase.invoice_number || '',
      supplier_name: purchase.supplier_name || '',
      category: purchase.category || 'Raw Material',
      item_name: purchase.item_name || '',
      quantity: purchase.quantity || 1,
      unit_price: purchase.unit_price || 0,
      gst_percentage: purchase.gst_percentage || 18,
      amount: purchase.amount || 0,
      gst_amount: purchase.gst_amount || 0,
      total_amount: purchase.total_amount || 0,
      payment_method: purchase.payment_method || 'Online',
      notes: purchase.notes || ''
    })
    setEditingId(purchase.id)
    setShowForm(true)
  }

  const handleDuplicate = (purchase) => {
    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      invoice_number: '', // Clear for new record
      supplier_name: purchase.supplier_name || '',
      category: purchase.category || 'Raw Material',
      item_name: purchase.item_name || '',
      quantity: purchase.quantity || 1,
      unit_price: purchase.unit_price || 0,
      gst_percentage: purchase.gst_percentage || 18,
      amount: purchase.amount || 0,
      gst_amount: purchase.gst_amount || 0,
      total_amount: purchase.total_amount || 0,
      payment_method: purchase.payment_method || 'Online',
      notes: purchase.notes || ''
    })
    setEditingId(null)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this purchase? Stock will be reduced.')) return

    try {
      if (!user) {
        alert('You must be logged in to delete purchases')
        return
      }
      
      // Get purchase details before deleting
      const { data: purchase, error: fetchError } = await supabase
        .from('purchases')
        .select('*')
        .eq('id', id)
        .single()
      
      if (fetchError) throw fetchError
      
      // Subtract stock from inventory
      if (purchase) {
        const { data: inventoryItems, error: invError } = await supabase
          .from('inventory')
          .select('*')
          .eq('product_name', purchase.item_name)
          .eq('user_id', user.id)
          .limit(1)
        
        if (invError) throw invError
        
        if (inventoryItems && inventoryItems.length > 0) {
          const item = inventoryItems[0]
          const newStock = Math.max(0, item.current_stock - purchase.quantity)
          
          const { error: updateInvError } = await supabase
            .from('inventory')
            .update({ 
              current_stock: newStock
            })
            .eq('id', item.id)
          
          if (updateInvError) throw updateInvError
          
          // Log stock movement
          await supabase.from('stock_movements').insert([{
            user_id: user.id,
            inventory_id: item.id,
            movement_type: 'OUT',
            quantity: purchase.quantity,
            reference_type: 'PURCHASE_DELETED',
            notes: `Purchase deleted - stock reduced`,
            movement_date: new Date().toISOString().split('T')[0]
          }])
        }
      }
      
      // Delete the purchase
      const { error } = await supabase
        .from('purchases')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchPurchases()
      alert('Purchase deleted! Stock has been adjusted.')
    } catch (error) {
      console.error('Error deleting purchase:', error)
      alert('Error deleting purchase: ' + error.message)
    }
  }

  const resetForm = () => {
    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      invoice_number: '',
      supplier_name: '',
      category: 'Raw Material',
      item_name: '',
      quantity: 1,
      unit_price: 0,
      gst_percentage: 18,
      amount: 0,
      gst_amount: 0,
      total_amount: 0,
      payment_method: 'Online',
      notes: ''
    })
    setEditingId(null)
    setShowForm(false)
  }

  const filteredPurchases = purchases.filter(purchase => {
    const matchesSearch = purchase.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         purchase.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         purchase.item_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'all' || purchase.category === filterCategory
    return matchesSearch && matchesCategory
  })

  // Calculate summary metrics (Neon returns NUMERIC columns as strings, so cast to Number)
  const totalPurchases = filteredPurchases.reduce(
    (sum, purchase) => sum + (Number(purchase.total_amount) || 0),
    0
  )
  const totalBaseAmount = filteredPurchases.reduce(
    (sum, purchase) => sum + (Number(purchase.amount) || 0),
    0
  )
  const totalGST = filteredPurchases.reduce(
    (sum, purchase) => sum + (Number(purchase.gst_amount) || 0),
    0
  )
  const totalQuantity = filteredPurchases.reduce(
    (sum, purchase) => sum + (Number(purchase.quantity) || 0),
    0
  )
  const uniqueSuppliers = [...new Set(filteredPurchases.map(p => p.supplier_name))].length
  const avgPurchaseValue = filteredPurchases.length > 0 ? totalPurchases / filteredPurchases.length : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Purchases</h2>
          <p className="text-gray-600">Track inventory and material purchases</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Purchase
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <p className="text-xs text-blue-600 mb-1 font-medium">Total Purchases</p>
          <p className="text-lg font-bold text-blue-700">₹{totalPurchases.toLocaleString('en-IN', {minimumFractionDigits: 2})}</p>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
          <p className="text-xs text-purple-600 mb-1 font-medium">Base Amount</p>
          <p className="text-lg font-bold text-purple-700">₹{totalBaseAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</p>
        </div>
        
        <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
          <p className="text-xs text-indigo-600 mb-1 font-medium">Total GST</p>
          <p className="text-lg font-bold text-indigo-700">₹{totalGST.toLocaleString('en-IN', {minimumFractionDigits: 2})}</p>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
          <p className="text-xs text-orange-600 mb-1 font-medium">Total Items</p>
          <p className="text-lg font-bold text-orange-700">{totalQuantity.toLocaleString('en-IN')}</p>
        </div>
        
        <div className="bg-teal-50 rounded-lg p-3 border border-teal-200">
          <p className="text-xs text-teal-600 mb-1 font-medium">Suppliers</p>
          <p className="text-lg font-bold text-teal-700">{uniqueSuppliers}</p>
        </div>
        
        <div className="bg-green-50 rounded-lg p-3 border border-green-200">
          <p className="text-xs text-green-600 mb-1 font-medium">Avg Purchase</p>
          <p className="text-lg font-bold text-green-700">₹{avgPurchaseValue.toLocaleString('en-IN', {minimumFractionDigits: 2})}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search purchases..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            >
              <option value="all">All Categories</option>
              <option value="Raw Material">Raw Material</option>
              <option value="Packing Material">Packing Material</option>
              <option value="Inventory">Inventory</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">GST</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="10" className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-6 py-12 text-center text-gray-500">
                    No purchases found. Add your first purchase!
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{format(new Date(purchase.date), 'dd MMM yyyy')}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{purchase.invoice_number}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{purchase.supplier_name}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full
                        ${purchase.category === 'Raw Material' ? 'bg-blue-100 text-blue-800' : ''}
                        ${purchase.category === 'Packing Material' ? 'bg-green-100 text-green-800' : ''}
                        ${purchase.category === 'Inventory' ? 'bg-purple-100 text-purple-800' : ''}
                        ${purchase.category === 'Other' ? 'bg-gray-100 text-gray-800' : ''}
                      `}>
                        {purchase.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{purchase.item_name}</td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900">{purchase.quantity}</td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900">₹{purchase.amount?.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900">₹{purchase.gst_amount?.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">₹{purchase.total_amount?.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleEdit(purchase)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(purchase)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="Duplicate"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(purchase.id)}
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
                {editingId ? 'Edit Purchase' : 'Add New Purchase'}
              </h3>
              <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Invoice Number</label>
                  <input
                    type="text"
                    value={formData.invoice_number}
                    onChange={(e) => setFormData({...formData, invoice_number: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    placeholder="PUR-001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Supplier Name *</label>
                  <input
                    type="text"
                    value={formData.supplier_name}
                    onChange={(e) => setFormData({...formData, supplier_name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    placeholder="Supplier name"
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
                    <option value="Raw Material">Raw Material</option>
                    <option value="Packing Material">Packing Material</option>
                    <option value="Inventory">Inventory</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Item Name *</label>
                  <input
                    type="text"
                    value={formData.item_name}
                    onChange={(e) => setFormData({...formData, item_name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    placeholder="Item description"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: parseFloat(e.target.value) || 0})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Unit Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({...formData, unit_price: parseFloat(e.target.value) || 0})}
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  >
                    <option value="Online">Online</option>
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Credit">Credit</option>
                  </select>
                </div>

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

              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Base Amount:</span>
                  <span className="font-medium">₹{formData.amount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">GST ({formData.gst_percentage}%):</span>
                  <span className="font-medium">₹{formData.gst_amount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                  <span>Total Amount:</span>
                  <span className="text-green-600">₹{formData.total_amount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
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
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  {editingId ? 'Update Purchase' : 'Add Purchase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Purchases
