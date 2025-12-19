import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Search, Edit2, Trash2, X, Laptop, Copy } from 'lucide-react'
import { format, differenceInMonths } from 'date-fns'

function Assets() {
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  
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
    // Auto-calculate GST and total cost
    const gstAmount = formData.purchase_price * (formData.gst_percentage / 100)
    const totalCost = formData.purchase_price + gstAmount
    
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
      const { data: { user } } = await supabase.auth.getUser()
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
      const { data: { user } } = await supabase.auth.getUser()
      const { accumulated_depreciation, current_value } = calculateDepreciation(formData)
      
      const assetData = {
        ...formData,
        user_id: user.id,
        accumulated_depreciation,
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
    setFormData({
      asset_name: asset.asset_name || '',
      category: asset.category || 'Computer',
      purchase_date: asset.purchase_date,
      purchase_price: asset.purchase_price || 0,
      gst_percentage: asset.gst_percentage || 18,
      gst_amount: asset.gst_amount || 0,
      total_cost: asset.total_cost || 0,
      depreciation_method: asset.depreciation_method || 'Straight Line',
      depreciation_rate: asset.depreciation_rate || 10,
      useful_life_years: asset.useful_life_years || 5,
      current_value: asset.current_value || 0,
      accumulated_depreciation: asset.accumulated_depreciation || 0,
      notes: asset.notes || ''
    })
    setEditingId(asset.id)
    setShowForm(true)
  }

  const handleDuplicate = (asset) => {
    setFormData({
      asset_name: asset.asset_name || '',
      category: asset.category || 'Computer',
      purchase_date: format(new Date(), 'yyyy-MM-dd'),
      purchase_price: asset.purchase_price || 0,
      gst_percentage: asset.gst_percentage || 18,
      gst_amount: asset.gst_amount || 0,
      total_cost: asset.total_cost || 0,
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

  const filteredAssets = assets.filter(asset => 
    asset.asset_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalPurchaseValue = filteredAssets.reduce((sum, asset) => sum + (asset.purchase_price || 0), 0)
  const totalCurrentValue = filteredAssets.reduce((sum, asset) => sum + (asset.current_value || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Assets</h2>
          <p className="text-gray-600">Manage assets and depreciation</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Asset
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600 mb-2">Total Assets</p>
          <p className="text-3xl font-bold text-gray-900">{filteredAssets.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600 mb-2">Purchase Value</p>
          <p className="text-3xl font-bold text-gray-900">₹{totalPurchaseValue.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600 mb-2">Current Value</p>
          <p className="text-3xl font-bold text-purple-600">₹{totalCurrentValue.toLocaleString('en-IN')}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Depreciation</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Current Value</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                    No assets found. Add your first asset!
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{asset.asset_name}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                        {asset.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{format(new Date(asset.purchase_date), 'dd MMM yyyy')}</td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900">₹{asset.purchase_price?.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{asset.depreciation_method}</td>
                    <td className="px-6 py-4 text-sm text-right text-red-600">₹{asset.accumulated_depreciation?.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4 text-sm text-right font-semibold text-purple-600">₹{asset.current_value?.toLocaleString('en-IN')}</td>
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
