import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Search, Edit2, Trash2, X, PackagePlus, PackageMinus, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'

function Inventory() {
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showStockAdjust, setShowStockAdjust] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  
  const [formData, setFormData] = useState({
    product_name: '',
    product_code: '',
    category: 'Gowns',
    unit: 'Pieces',
    opening_stock: 0,
    current_stock: 0,
    minimum_stock: 5,
    location: '',
    notes: ''
  })

  const [adjustData, setAdjustData] = useState({
    movement_type: 'IN',
    quantity: 0,
    notes: '',
    movement_date: format(new Date(), 'yyyy-MM-dd')
  })

  useEffect(() => {
    fetchInventory()
  }, [])

  const fetchInventory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('user_id', user.id)
        .order('product_name')

      if (error) throw error
      setInventory(data || [])
    } catch (error) {
      console.error('Error fetching inventory:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (editingId) {
        const { error } = await supabase
          .from('inventory')
          .update({ ...formData, user_id: user.id })
          .eq('id', editingId)
        if (error) throw error
      } else {
        // Check for duplicate product name
        const { data: existingProducts, error: checkError } = await supabase
          .from('inventory')
          .select('id, product_name')
          .eq('product_name', formData.product_name)
          .eq('user_id', user.id)
        
        if (checkError) throw checkError
        
        if (existingProducts && existingProducts.length > 0) {
          alert(`Product "${formData.product_name}" already exists in inventory!\n\nPlease use a unique product name or edit the existing entry.`)
          return
        }
        
        const productData = { ...formData, user_id: user.id, current_stock: formData.opening_stock }
        const { error } = await supabase.from('inventory').insert([productData])
        if (error) throw error
      }
      resetForm()
      fetchInventory()
    } catch (error) {
      alert('Error saving product: ' + error.message)
    }
  }

  const handleStockAdjust = async (e) => {
    e.preventDefault()
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('stock_movements').insert([{
        user_id: user.id,
        inventory_id: selectedProduct.id,
        movement_type: adjustData.movement_type,
        quantity: Math.abs(adjustData.quantity),
        reference_type: 'ADJUSTMENT',
        notes: adjustData.notes,
        movement_date: adjustData.movement_date
      }])
      if (error) throw error
      setShowStockAdjust(false)
      fetchInventory()
    } catch (error) {
      alert('Error adjusting stock: ' + error.message)
    }
  }

  const handleEdit = (item) => {
    setFormData({ ...item })
    setEditingId(item.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return
    try {
      const { error } = await supabase.from('inventory').delete().eq('id', id)
      if (error) throw error
      fetchInventory()
    } catch (error) {
      console.error('Error deleting:', error)
    }
  }

  const openStockAdjust = (product) => {
    setSelectedProduct(product)
    setAdjustData({ movement_type: 'IN', quantity: 0, notes: '', movement_date: format(new Date(), 'yyyy-MM-dd') })
    setShowStockAdjust(true)
  }

  const resetForm = () => {
    setFormData({ product_name: '', product_code: '', category: 'Gowns', unit: 'Pieces', opening_stock: 0, current_stock: 0, minimum_stock: 5, location: '', notes: '' })
    setEditingId(null)
    setShowForm(false)
  }

  const filtered = inventory.filter(i => i.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) || i.product_code?.toLowerCase().includes(searchTerm.toLowerCase()))
  const lowStock = filtered.filter(i => i.current_stock <= i.minimum_stock)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Inventory Management</h2>
          <p className="text-gray-600">Track stock levels and product information</p>
        </div>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center">
          <Plus className="w-4 h-4 mr-2" />Add Product
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <p className="text-sm text-gray-600 mb-2">Total Products</p>
          <p className="text-3xl font-bold">{filtered.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <p className="text-sm text-gray-600 mb-2">Low Stock Items</p>
          <p className="text-3xl font-bold text-red-600">{lowStock.length}</p>
        </div>
      </div>

      {lowStock.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-red-800">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-semibold">Low Stock Alert: {lowStock.length} product(s) below minimum</span>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Current Stock</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Min Stock</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan="8" className="px-6 py-12 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="8" className="px-6 py-12 text-center text-gray-500">No products found</td></tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{item.product_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.product_code}</td>
                  <td className="px-6 py-4"><span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">{item.category}</span></td>
                  <td className={`px-6 py-4 text-right font-semibold ${item.current_stock <= item.minimum_stock ? 'text-red-600' : 'text-gray-900'}`}>{item.current_stock}</td>
                  <td className="px-6 py-4 text-right text-gray-600">{item.minimum_stock}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center space-x-2">
                      <button onClick={() => openStockAdjust(item)} className="p-1 text-green-600 hover:bg-green-50 rounded" title="Adjust Stock"><PackagePlus className="w-4 h-4" /></button>
                      <button onClick={() => handleEdit(item)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold">{editingId ? 'Edit Product' : 'Add New Product'}</h3>
              <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="block text-sm font-medium mb-2">Product Name *</label><input type="text" value={formData.product_name} onChange={(e) => setFormData({...formData, product_name: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary" required /></div>
                <div><label className="block text-sm font-medium mb-2">Product Code</label><input type="text" value={formData.product_code} onChange={(e) => setFormData({...formData, product_code: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary" placeholder="SKU-001" /></div>
                <div><label className="block text-sm font-medium mb-2">Category</label><input type="text" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary" /></div>
                <div><label className="block text-sm font-medium mb-2">Unit</label><select value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary"><option>Pieces</option><option>Meters</option><option>Kg</option><option>Liters</option></select></div>
                <div><label className="block text-sm font-medium mb-2">Opening Stock</label><input type="number" value={formData.opening_stock} onChange={(e) => setFormData({...formData, opening_stock: parseFloat(e.target.value) || 0})} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary" /></div>
                <div><label className="block text-sm font-medium mb-2">Minimum Stock</label><input type="number" value={formData.minimum_stock} onChange={(e) => setFormData({...formData, minimum_stock: parseFloat(e.target.value) || 0})} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary" /></div>
                <div><label className="block text-sm font-medium mb-2">Location</label><input type="text" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary" placeholder="Shelf A1" /></div>
                <div className="col-span-2"><label className="block text-sm font-medium mb-2">Notes</label><textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} rows="2" className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary resize-none" /></div>
              </div>
              <div className="flex space-x-3 pt-4"><button type="button" onClick={resetForm} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button><button type="submit" className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">{editingId ? 'Update' : 'Add'} Product</button></div>
            </form>
          </div>
        </div>
      )}

      {showStockAdjust && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold">Stock Adjustment</h3>
              <button onClick={() => setShowStockAdjust(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleStockAdjust} className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg"><p className="text-sm text-gray-600">Product</p><p className="font-semibold">{selectedProduct.product_name}</p><p className="text-sm text-gray-600 mt-2">Current Stock: <span className="font-semibold">{selectedProduct.current_stock}</span></p></div>
              <div><label className="block text-sm font-medium mb-2">Movement Type</label><select value={adjustData.movement_type} onChange={(e) => setAdjustData({...adjustData, movement_type: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary"><option value="IN">Stock IN (+)</option><option value="OUT">Stock OUT (-)</option></select></div>
              <div><label className="block text-sm font-medium mb-2">Quantity</label><input type="number" min="0" value={adjustData.quantity} onChange={(e) => setAdjustData({...adjustData, quantity: parseFloat(e.target.value) || 0})} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary" required /></div>
              <div><label className="block text-sm font-medium mb-2">Date</label><input type="date" value={adjustData.movement_date} onChange={(e) => setAdjustData({...adjustData, movement_date: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary" required /></div>
              <div><label className="block text-sm font-medium mb-2">Notes</label><textarea value={adjustData.notes} onChange={(e) => setAdjustData({...adjustData, notes: e.target.value})} rows="2" className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary resize-none" placeholder="Reason for adjustment" /></div>
              <div className="flex space-x-3 pt-4"><button type="button" onClick={() => setShowStockAdjust(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button><button type="submit" className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Adjust Stock</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Inventory
