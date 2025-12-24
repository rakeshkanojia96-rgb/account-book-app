import { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { supabase } from '../lib/supabase'
import { Plus, Search, Filter, Download, Edit2, Trash2, X, Calendar, Copy } from 'lucide-react'
import { format, parse, isValid, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import * as XLSX from 'xlsx'

function Sales() {
  const { user } = useUser()
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPlatform, setFilterPlatform] = useState('all')
  const [expenseCategories, setExpenseCategories] = useState([])
  const [dateFilter, setDateFilter] = useState('all')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    invoice_number: '',
    order_id: '',
    customer_name: '',
    platform: 'Meesho',
    product_name: '',
    quantity: 1,
    unit_price: 0,
    gst_percentage: 18,
    gst_inclusive: false,
    amount: 0,
    gst_amount: 0,
    total_amount: 0,
    cost_price: 0,
    amount_received: 0,
    platform_commission: 0,
    selling_expense_amount: 0,
    selling_expense_category: '',
    selling_expense_notes: '',
    profit_amount: 0,
    payment_method: 'Online',
    notes: ''
  })

  useEffect(() => {
    fetchSales()
    fetchExpenseCategories()
  }, [])

  useEffect(() => {
    // Auto-calculate amounts based on GST inclusive/exclusive
    let baseAmount, gstAmount, totalAmount, amountReceived, platformCommission, profitAmount
    
    // Step 1: Calculate total amount and GST from selling price
    if (formData.gst_inclusive) {
      // Price includes GST - extract GST component
      totalAmount = formData.quantity * formData.unit_price
      baseAmount = totalAmount / (1 + formData.gst_percentage / 100)
      gstAmount = totalAmount - baseAmount
    } else {
      // Price excludes GST - add GST on top
      baseAmount = formData.quantity * formData.unit_price
      gstAmount = baseAmount * (formData.gst_percentage / 100)
      totalAmount = baseAmount + gstAmount
    }
    
    // Step 2: If Amount Received is provided and GST Inclusive, extract GST from Amount Received
    if (formData.amount_received > 0 && formData.gst_inclusive) {
      amountReceived = formData.amount_received
      // Extract GST from the amount received
      const receivedBase = amountReceived / (1 + formData.gst_percentage / 100)
      const receivedGst = amountReceived - receivedBase
      
      // Use GST from amount received for display
      baseAmount = receivedBase
      gstAmount = receivedGst
      platformCommission = totalAmount - amountReceived
      // Profit = Received - Cost - Selling Expenses
      profitAmount = receivedBase - (formData.cost_price * formData.quantity) - (formData.selling_expense_amount || 0)
    } else {
      // Use calculated values
      amountReceived = formData.amount_received || totalAmount
      platformCommission = totalAmount - amountReceived
      // Profit = Received - Cost - Selling Expenses
      profitAmount = amountReceived - (formData.cost_price * formData.quantity) - (formData.selling_expense_amount || 0)
    }
    
    setFormData(prev => ({
      ...prev,
      amount: parseFloat(baseAmount.toFixed(2)),
      gst_amount: parseFloat(gstAmount.toFixed(2)),
      total_amount: parseFloat(totalAmount.toFixed(2)),
      platform_commission: parseFloat(platformCommission.toFixed(2)),
      profit_amount: parseFloat(profitAmount.toFixed(2))
    }))
  }, [formData.quantity, formData.unit_price, formData.gst_percentage, formData.gst_inclusive, formData.cost_price, formData.amount_received, formData.selling_expense_amount])

  const fetchSales = async () => {
    try {
      if (!user) return
      
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })

      if (error) throw error
      setSales(data || [])
    } catch (error) {
      console.error('Error fetching sales:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchExpenseCategories = async () => {
    try {
      if (!user) return
      
      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_selling_expense', true)
        .order('category_name')
      
      if (error) throw error
      setExpenseCategories(data || [])
    } catch (error) {
      console.error('Error fetching expense categories:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      if (!user) {
        alert('You must be logged in to save sales')
        return
      }
      
      if (editingId) {
        // When editing an existing sale, adjust inventory based on the
        // difference between the old sale quantity/product and the new ones.

        // 1) Load the existing sale from the database
        const { data: existingSale, error: existingError } = await supabase
          .from('sales')
          .select('*')
          .eq('id', editingId)
          .single()

        if (existingError) throw existingError

        const oldQty = Number(existingSale?.quantity) || 0
        const newQty = Number(formData.quantity) || 0
        const oldProductName = existingSale?.product_name || ''
        const newProductName = formData.product_name || ''

        // 2) Update the sale record itself
        const { error } = await supabase
          .from('sales')
          .update({ ...formData, user_id: user.id })
          .eq('id', editingId)
        
        if (error) throw error

        // 3) If quantity or product changed, adjust inventory accordingly
        const productChanged = oldProductName.trim().toLowerCase() !== newProductName.trim().toLowerCase()

        if (productChanged) {
          // Case A: Product name changed – treat it like deleting the old sale
          // for the old product and inserting a new sale for the new product.

          // A1: Add stock back to OLD product
          if (oldProductName) {
            const { data: oldInvItems, error: oldInvError } = await supabase
              .from('inventory')
              .select('*')
              .ilike('product_name', oldProductName)
              .eq('user_id', user.id)
              .limit(1)

            if (oldInvError) throw oldInvError

            if (oldInvItems && oldInvItems.length > 0) {
              const item = oldInvItems[0]
              const currentStock = Number(item.current_stock) || 0
              const restoreQty = oldQty
              const newStock = currentStock + restoreQty

              const { error: updateOldInvError } = await supabase
                .from('inventory')
                .update({ current_stock: newStock })
                .eq('id', item.id)

              if (updateOldInvError) throw updateOldInvError

              await supabase.from('stock_movements').insert([
                {
                  user_id: user.id,
                  inventory_id: item.id,
                  movement_type: 'IN',
                  quantity: restoreQty,
                  reference_type: 'SALE_EDIT',
                  notes: `Sale updated (product changed) – stock restored for ${oldProductName}`
                }
              ])
            }
          }

          // A2: Reduce stock for NEW product
          if (newProductName && newQty !== 0) {
            const { data: newInvItems, error: newInvError } = await supabase
              .from('inventory')
              .select('*')
              .ilike('product_name', newProductName)
              .eq('user_id', user.id)
              .limit(1)

            if (newInvError) throw newInvError

            if (newInvItems && newInvItems.length > 0) {
              const item = newInvItems[0]
              const currentStock = Number(item.current_stock) || 0
              const saleQty = newQty
              const newStock = Math.max(0, currentStock - saleQty)

              const { error: updateNewInvError } = await supabase
                .from('inventory')
                .update({ current_stock: newStock })
                .eq('id', item.id)

              if (updateNewInvError) throw updateNewInvError

              await supabase.from('stock_movements').insert([
                {
                  user_id: user.id,
                  inventory_id: item.id,
                  movement_type: 'OUT',
                  quantity: saleQty,
                  reference_type: 'SALE_EDIT',
                  notes: `Sale updated (product changed) – stock reduced for ${newProductName}`
                }
              ])
            }
          }
        } else {
          // Case B: Same product, quantity changed – adjust by the difference
          const qtyDelta = newQty - oldQty // positive => more sold (reduce stock), negative => less sold (increase stock)

          if (qtyDelta !== 0 && newProductName) {
            const { data: invItems, error: invError } = await supabase
              .from('inventory')
              .select('*')
              .ilike('product_name', newProductName)
              .eq('user_id', user.id)
              .limit(1)

            if (invError) throw invError

            if (invItems && invItems.length > 0) {
              const item = invItems[0]
              const currentStock = Number(item.current_stock) || 0
              const adjustQty = Math.abs(qtyDelta)
              const stockDelta = qtyDelta > 0 ? -adjustQty : adjustQty
              const newStock = Math.max(0, currentStock + stockDelta)

              const { error: updateInvError } = await supabase
                .from('inventory')
                .update({ current_stock: newStock })
                .eq('id', item.id)

              if (updateInvError) throw updateInvError

              const movementType = qtyDelta > 0 ? 'OUT' : 'IN'

              await supabase.from('stock_movements').insert([
                {
                  user_id: user.id,
                  inventory_id: item.id,
                  movement_type: movementType,
                  quantity: adjustQty,
                  reference_type: 'SALE_EDIT',
                  notes: `Sale updated – quantity changed from ${oldQty} to ${newQty}`
                }
              ])
            }
          }
        }
      } else {
        // Check if order_id already exists (if provided)
        if (formData.order_id) {
          const { data: existingSales, error: checkError } = await supabase
            .from('sales')
            .select('id')
            .eq('order_id', formData.order_id)
            .eq('user_id', user.id)
          
          if (checkError) throw checkError
          
          if (existingSales && existingSales.length > 0) {
            alert(`Order ID "${formData.order_id}" already exists! Each order can only have one sale entry.`)
            return
          }
        }
        
        // Insert new sale
        const { error } = await supabase
          .from('sales')
          .insert([{ ...formData, user_id: user.id }])
        
        if (error) throw error
        
        // AUTO-UPDATE INVENTORY: Reduce stock when sale is made
        const { data: inventoryItems, error: invError } = await supabase
          .from('inventory')
          .select('*')
          .ilike('product_name', formData.product_name)
          .eq('user_id', user.id)
          .limit(1)
        
        if (invError) throw invError
        
        if (inventoryItems && inventoryItems.length > 0) {
          const item = inventoryItems[0]
          const currentStock = Number(item.current_stock) || 0
          const saleQty = Number(formData.quantity) || 0
          const newStock = Math.max(0, currentStock - saleQty)
          
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
            quantity: saleQty,
            reference_type: 'SALE',
            notes: `Sale to ${formData.customer_name || 'Customer'}`
          }])
        }
      }

      resetForm()
      fetchSales()
      alert(editingId ? 'Sale updated!' : 'Sale added! Stock updated automatically.')
    } catch (error) {
      console.error('Error saving sale:', error)
      alert('Error saving sale: ' + error.message)
    }
  }

  const handleEdit = (sale) => {
    setFormData({
      // Ensure date is in yyyy-MM-dd format for the date input
      date: sale.date ? format(new Date(sale.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      invoice_number: sale.invoice_number || '',
      order_id: sale.order_id || '',
      customer_name: sale.customer_name || '',
      platform: sale.platform || 'Meesho',
      product_name: sale.product_name || '',
      quantity: sale.quantity || 1,
      unit_price: sale.unit_price || 0,
      gst_percentage: sale.gst_percentage || 18,
      gst_inclusive: sale.gst_inclusive || false,
      amount: sale.amount || 0,
      gst_amount: sale.gst_amount || 0,
      total_amount: sale.total_amount || 0,
      cost_price: sale.cost_price || 0,
      amount_received: sale.amount_received || 0,
      platform_commission: sale.platform_commission || 0,
      selling_expense_amount: sale.selling_expense_amount || 0,
      selling_expense_category: sale.selling_expense_category || '',
      selling_expense_notes: sale.selling_expense_notes || '',
      profit_amount: sale.profit_amount || 0,
      payment_method: sale.payment_method || 'Online',
      notes: sale.notes || ''
    })
    setEditingId(sale.id)
    setShowForm(true)
  }

  const handleDuplicate = (sale) => {
    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'), // Set today's date
      invoice_number: '', // Clear invoice number for new record
      order_id: '', // Clear order ID for new record
      customer_name: sale.customer_name || '',
      platform: sale.platform || 'Meesho',
      product_name: sale.product_name || '',
      quantity: sale.quantity || 1,
      unit_price: sale.unit_price || 0,
      gst_percentage: sale.gst_percentage || 18,
      gst_inclusive: sale.gst_inclusive || false,
      amount: sale.amount || 0,
      gst_amount: sale.gst_amount || 0,
      total_amount: sale.total_amount || 0,
      cost_price: sale.cost_price || 0,
      amount_received: sale.amount_received || 0,
      platform_commission: sale.platform_commission || 0,
      selling_expense_category: sale.selling_expense_category || '',
      selling_expense_amount: sale.selling_expense_amount || 0,
      selling_expense_notes: sale.selling_expense_notes || '',
      profit_amount: sale.profit_amount || 0,
      payment_method: sale.payment_method || 'Online',
      notes: sale.notes || ''
    })
    setEditingId(null) // Important: null means new record
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this sale? Stock will be added back.')) return

    try {
      if (!user) {
        alert('You must be logged in to delete sales')
        return
      }
      
      // Get sale details before deleting
      const { data: sale, error: fetchError } = await supabase
        .from('sales')
        .select('*')
        .eq('id', id)
        .single()
      
      if (fetchError) throw fetchError
      
      // Add stock back to inventory
      if (sale && !sale.is_returned) {
        const { data: inventoryItems, error: invError } = await supabase
          .from('inventory')
          .select('*')
          .ilike('product_name', sale.product_name)
          .eq('user_id', user.id)
          .limit(1)
        
        if (invError) throw invError
        
        if (inventoryItems && inventoryItems.length > 0) {
          const item = inventoryItems[0]
          const currentStock = Number(item.current_stock) || 0
          const saleQty = Number(sale.quantity) || 0
          const newStock = currentStock + saleQty
          
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
            movement_type: 'IN',
            quantity: saleQty,
            reference_type: 'SALE_DELETED',
            notes: `Sale deleted - stock restored`
          }])
        }
      }
      
      // Delete the sale
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchSales()
      alert('Sale deleted! Stock has been restored.')
    } catch (error) {
      console.error('Error deleting sale:', error)
      alert('Error deleting sale: ' + error.message)
    }
  }

  const resetForm = () => {
    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      invoice_number: '',
      order_id: '',
      customer_name: '',
      platform: 'Meesho',
      product_name: '',
      quantity: 1,
      unit_price: 0,
      gst_percentage: 18,
      gst_inclusive: false,
      amount: 0,
      gst_amount: 0,
      total_amount: 0,
      cost_price: 0,
      amount_received: 0,
      platform_commission: 0,
      selling_expense_amount: 0,
      selling_expense_category: '',
      selling_expense_notes: '',
      profit_amount: 0,
      payment_method: 'Online',
      notes: ''
    })
    setEditingId(null)
    setShowForm(false)
  }

  const parseCsvDate = (value) => {
    if (value === undefined || value === null || value === '') return null

    if (value instanceof Date && isValid(value)) {
      return format(value, 'yyyy-MM-dd')
    }

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
      'date',
      'invoice_number',
      'order_id',
      'customer_name',
      'platform',
      'product_name',
      'quantity',
      'unit_price',
      'gst_percentage',
      'gst_inclusive',
      'cost_price',
      'amount_received',
      'selling_expense_amount',
      'selling_expense_category',
      'payment_method',
      'notes'
    ]

    const sampleRow = [
      '28-01-2023',
      'INV-001',
      'ORD-001',
      'Sample Customer',
      'Meesho',
      'Sample Product',
      '2',
      '500',
      '18',
      'FALSE',
      '300',
      '1000',
      '0',
      '',
      'Online',
      'Sample notes (date format dd-mm-yyyy)'
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
    link.setAttribute('download', 'sales_template.csv')
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
        'date',
        'platform',
        'product_name',
        'quantity',
        'unit_price',
        'gst_percentage'
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
          const dbDate = parseCsvDate(row.date)
          if (!dbDate) {
            const raw = row.date
            throw new Error(
              `Invalid date format for "${raw}" (type ${typeof raw}). Use dd-mm-yyyy or dd-MMM-yyyy (e.g. 11-03-2023 or 11-Mar-2023)`
            )
          }

          const quantity = Number(row.quantity)
          const unitPrice = Number(row.unit_price)

          const rawGst = row.gst_percentage === undefined || row.gst_percentage === null
            ? ''
            : String(row.gst_percentage).trim().replace('%', '')

          let gstPercentage = rawGst === '' ? 0 : Number(rawGst)

          if (!Number.isNaN(gstPercentage) && gstPercentage > 0 && gstPercentage <= 1) {
            gstPercentage = gstPercentage * 100
          }

          const costPrice = row.cost_price === undefined || row.cost_price === null
            ? 0
            : Number(row.cost_price)

          const amountReceivedInput = row.amount_received === undefined || row.amount_received === null
            ? 0
            : Number(row.amount_received)

          const sellingExpenseAmount = row.selling_expense_amount === undefined || row.selling_expense_amount === null
            ? 0
            : Number(row.selling_expense_amount)

          if (!row.product_name) {
            throw new Error('product_name is required')
          }
          if (
            Number.isNaN(quantity) ||
            Number.isNaN(unitPrice) ||
            Number.isNaN(gstPercentage) ||
            Number.isNaN(costPrice) ||
            Number.isNaN(amountReceivedInput) ||
            Number.isNaN(sellingExpenseAmount)
          ) {
            throw new Error('quantity, unit_price, gst_percentage, cost_price, amount_received, and selling_expense_amount must be numbers')
          }

          const gstInclusiveValue = String(row.gst_inclusive ?? '').trim().toLowerCase()
          const gstInclusive =
            gstInclusiveValue === 'true' ||
            gstInclusiveValue === 'yes' ||
            gstInclusiveValue === 'y' ||
            gstInclusiveValue === '1'

          let baseAmount
          let gstAmount
          let totalAmount
          let amountReceived
          let platformCommission
          let profitAmount

          if (gstInclusive) {
            totalAmount = quantity * unitPrice
            baseAmount = totalAmount / (1 + gstPercentage / 100)
            gstAmount = totalAmount - baseAmount
          } else {
            baseAmount = quantity * unitPrice
            gstAmount = baseAmount * (gstPercentage / 100)
            totalAmount = baseAmount + gstAmount
          }

          if (amountReceivedInput > 0 && gstInclusive) {
            amountReceived = amountReceivedInput
            const receivedBase = amountReceived / (1 + gstPercentage / 100)
            const receivedGst = amountReceived - receivedBase
            baseAmount = receivedBase
            gstAmount = receivedGst
            platformCommission = totalAmount - amountReceived
            profitAmount = receivedBase - (costPrice * quantity) - sellingExpenseAmount
          } else {
            amountReceived = amountReceivedInput || totalAmount
            platformCommission = totalAmount - amountReceived
            profitAmount = amountReceived - (costPrice * quantity) - sellingExpenseAmount
          }

          const orderId = row.order_id || ''

          if (orderId) {
            const { data: existingSales, error: checkError } = await supabase
              .from('sales')
              .select('id')
              .eq('order_id', orderId)
              .eq('user_id', user.id)

            if (checkError) throw checkError

            if (existingSales && existingSales.length > 0) {
              throw new Error(`Order ID "${orderId}" already exists. Each order can only have one sale entry.`)
            }
          }

          const saleRecord = {
            date: dbDate,
            invoice_number: row.invoice_number || '',
            order_id: orderId,
            customer_name: row.customer_name || '',
            platform: row.platform || 'Meesho',
            product_name: row.product_name,
            quantity,
            unit_price: unitPrice,
            gst_percentage: gstPercentage,
            gst_inclusive: gstInclusive,
            amount: parseFloat(baseAmount.toFixed(2)),
            gst_amount: parseFloat(gstAmount.toFixed(2)),
            total_amount: parseFloat(totalAmount.toFixed(2)),
            cost_price: costPrice,
            amount_received: parseFloat(amountReceived.toFixed(2)),
            platform_commission: parseFloat(platformCommission.toFixed(2)),
            selling_expense_amount: sellingExpenseAmount,
            selling_expense_category: row.selling_expense_category || '',
            selling_expense_notes: row.selling_expense_notes || '',
            profit_amount: parseFloat(profitAmount.toFixed(2)),
            payment_method: row.payment_method || 'Online',
            notes: row.notes || ''
          }

          const { error: insertError } = await supabase
            .from('sales')
            .insert([{ ...saleRecord, user_id: user.id }])

          if (insertError) throw insertError

          const { data: inventoryItems, error: invError } = await supabase
            .from('inventory')
            .select('*')
            .ilike('product_name', saleRecord.product_name)
            .eq('user_id', user.id)
            .limit(1)

          if (invError) throw invError

          const saleQty = Number(saleRecord.quantity) || 0

          if (inventoryItems && inventoryItems.length > 0) {
            const item = inventoryItems[0]
            const currentStock = Number(item.current_stock) || 0
            const newStock = Math.max(0, currentStock - saleQty)

            const { error: updateInvError } = await supabase
              .from('inventory')
              .update({
                current_stock: newStock
              })
              .eq('id', item.id)

            if (updateInvError) throw updateInvError

            const { error: movementError } = await supabase
              .from('stock_movements')
              .insert([
                {
                  user_id: user.id,
                  inventory_id: item.id,
                  movement_type: 'OUT',
                  quantity: saleQty,
                  reference_type: 'SALE',
                  notes: `Sale to ${saleRecord.customer_name || 'Customer'}`
                }
              ])

            if (movementError) throw movementError
          }

          successCount++
        } catch (rowError) {
          console.error('Error importing row', i + 2, rowError)
          rowErrors.push({
            rowNumber: i + 2,
            message: rowError?.message || String(rowError)
          })
          errorCount++
        }
      }

      let message = `CSV import complete. Imported: ${successCount}, Failed: ${errorCount}`

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
      fetchSales()
    } catch (error) {
      console.error('Error processing CSV:', error)
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

  const filteredSales = sales.filter(sale => {
    const matchesSearch = sale.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sale.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sale.order_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sale.product_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPlatform = filterPlatform === 'all' || sale.platform === filterPlatform
    const matchesDate = isWithinDateFilter(sale.date)
    return matchesSearch && matchesPlatform && matchesDate
  })

  // Calculate summary metrics (cast NUMERIC strings from Neon to numbers)
  const totalSales = filteredSales.reduce((sum, sale) => sum + (Number(sale.total_amount) || 0), 0)
  const totalBaseAmount = filteredSales.reduce((sum, sale) => sum + (Number(sale.amount) || 0), 0)
  const totalGST = filteredSales.reduce((sum, sale) => sum + (Number(sale.gst_amount) || 0), 0)
  const totalCost = filteredSales.reduce((sum, sale) => sum + (Number(sale.cost_price) || 0), 0)
  const totalReceived = filteredSales.reduce((sum, sale) => sum + (Number(sale.amount_received) || 0), 0)
  const totalCommission = filteredSales.reduce((sum, sale) => sum + (Number(sale.platform_commission) || 0), 0)
  const totalExpenses = filteredSales.reduce((sum, sale) => sum + (Number(sale.selling_expense_amount) || 0), 0)
  const totalProfit = filteredSales.reduce((sum, sale) => sum + (Number(sale.profit_amount) || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sales</h2>
          <p className="text-gray-600">Manage your online and offline sales</p>
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
            className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Sale
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <p className="text-xs text-blue-600 mb-1 font-medium">Total Sales</p>
          <p className="text-lg font-bold text-blue-700">₹{totalSales.toLocaleString('en-IN', {minimumFractionDigits: 2})}</p>
        </div>
        
        <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
          <p className="text-xs text-indigo-600 mb-1 font-medium">Total GST</p>
          <p className="text-lg font-bold text-indigo-700">₹{totalGST.toLocaleString('en-IN', {minimumFractionDigits: 2})}</p>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
          <p className="text-xs text-orange-600 mb-1 font-medium">Cost Price</p>
          <p className="text-lg font-bold text-orange-700">₹{totalCost.toLocaleString('en-IN', {minimumFractionDigits: 2})}</p>
        </div>
        
        <div className="bg-teal-50 rounded-lg p-3 border border-teal-200">
          <p className="text-xs text-teal-600 mb-1 font-medium">Amount Received</p>
          <p className="text-lg font-bold text-teal-700">₹{totalReceived.toLocaleString('en-IN', {minimumFractionDigits: 2})}</p>
        </div>
        
        <div className="bg-red-50 rounded-lg p-3 border border-red-200">
          <p className="text-xs text-red-600 mb-1 font-medium">Expenses</p>
          <p className="text-lg font-bold text-red-700">₹{totalExpenses.toLocaleString('en-IN', {minimumFractionDigits: 2})}</p>
        </div>
        
        <div className={`rounded-lg p-3 border-2 ${
          totalProfit >= 0 
            ? 'bg-green-50 border-green-300' 
            : 'bg-red-50 border-red-300'
        }`}>
          <p className={`text-xs mb-1 font-medium ${
            totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {totalProfit >= 0 ? '💰 Net Profit' : '📉 Net Loss'}
          </p>
          <p className={`text-lg font-bold ${
            totalProfit >= 0 ? 'text-green-700' : 'text-red-700'
          }`}>
            ₹{Math.abs(totalProfit).toLocaleString('en-IN', {minimumFractionDigits: 2})}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search sales..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={filterPlatform}
              onChange={(e) => setFilterPlatform(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            >
              <option value="all">All Platforms</option>
              <option value="Meesho">Meesho</option>
              <option value="Amazon">Amazon</option>
              <option value="Flipkart">Flipkart</option>
              <option value="Offline">Offline</option>
            </select>
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

      {/* Sales Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Platform</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">GST</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="10" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-6 py-12 text-center text-gray-500">
                    No sales found. Add your first sale to get started!
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{format(new Date(sale.date), 'dd MMM yyyy')}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{sale.invoice_number}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{sale.customer_name}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full
                        ${sale.platform === 'Meesho' ? 'bg-pink-100 text-pink-800' : ''}
                        ${sale.platform === 'Amazon' ? 'bg-orange-100 text-orange-800' : ''}
                        ${sale.platform === 'Flipkart' ? 'bg-blue-100 text-blue-800' : ''}
                        ${sale.platform === 'Offline' ? 'bg-gray-100 text-gray-800' : ''}
                      `}>
                        {sale.platform}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{sale.product_name}</td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900">{sale.quantity}</td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900">₹{sale.amount?.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900">₹{sale.gst_amount?.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">₹{sale.total_amount?.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleEdit(sale)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(sale)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="Duplicate"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(sale.id)}
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

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                {editingId ? 'Edit Sale' : 'Add New Sale'}
              </h3>
              <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    required
                  />
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
                    placeholder="INV-001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Order ID
                  </label>
                  <input
                    type="text"
                    value={formData.order_id}
                    onChange={(e) => setFormData({...formData, order_id: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    placeholder="Platform order ID"
                  />
                  <p className="text-xs text-gray-500 mt-1">Meesho/Amazon order number</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    placeholder="Customer name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Platform *
                  </label>
                  <select
                    value={formData.platform}
                    onChange={(e) => setFormData({...formData, platform: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    required
                  >
                    <option value="Meesho">Meesho</option>
                    <option value="Amazon">Amazon</option>
                    <option value="Flipkart">Flipkart</option>
                    <option value="Offline">Offline</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={formData.product_name}
                    onChange={(e) => setFormData({...formData, product_name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    placeholder="Gown - Design ABC"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity *
                  </label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {formData.gst_inclusive ? 'Selling Price (₹) *' : 'Unit Price (₹) *'}
                  </label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GST % (Optional)
                  </label>
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

                <div className="md:col-span-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.gst_inclusive}
                      onChange={(e) => setFormData({...formData, gst_inclusive: e.target.checked})}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-2 focus:ring-primary"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      ✓ GST Inclusive (Price already includes GST)
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1 ml-6">
                    {formData.gst_inclusive 
                      ? 'GST will be extracted from the selling price' 
                      : 'GST will be added on top of unit price'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cost Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({...formData, cost_price: parseFloat(e.target.value) || 0})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    placeholder="Your cost per unit"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount Received (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.amount_received}
                    onChange={(e) => setFormData({...formData, amount_received: parseFloat(e.target.value) || 0})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    placeholder="After platform commission"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave blank if same as total</p>
                </div>

                {/* Selling Expenses Section */}
                <div className="md:col-span-2 border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    💼 Selling Expenses (Packing, Transport, etc.)
                  </h4>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expense Category
                  </label>
                  <select
                    value={formData.selling_expense_category}
                    onChange={(e) => setFormData({...formData, selling_expense_category: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  >
                    <option value="">No expense</option>
                    {expenseCategories.map(cat => (
                      <option key={cat.id} value={cat.category_name}>{cat.category_name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Direct cost to complete this sale</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expense Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.selling_expense_amount}
                    onChange={(e) => setFormData({...formData, selling_expense_amount: parseFloat(e.target.value) || 0})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    placeholder="e.g., packing + transport"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expense Notes
                  </label>
                  <input
                    type="text"
                    value={formData.selling_expense_notes}
                    onChange={(e) => setFormData({...formData, selling_expense_notes: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    placeholder="e.g., Bubble wrap ₹20 + Courier ₹50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method
                  </label>
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
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Base Amount:</span>
                  <span className="font-medium">₹{formData.amount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">GST ({formData.gst_percentage}%):</span>
                  <span className="font-medium">₹{formData.gst_amount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold border-t border-gray-200 pt-2">
                  <span>Total Amount:</span>
                  <span className="text-primary">₹{formData.total_amount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                </div>
                {formData.platform_commission > 0 && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span>(-) Platform Commission:</span>
                    <span>₹{formData.platform_commission.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                  </div>
                )}
                {formData.amount_received > 0 && (
                  <div className="flex justify-between text-sm font-semibold text-green-600">
                    <span>Amount Received:</span>
                    <span>₹{formData.amount_received.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                  </div>
                )}
                {formData.cost_price > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">(-) Cost:</span>
                    <span>₹{(formData.cost_price * formData.quantity).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                  </div>
                )}
                {formData.selling_expense_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">(-) Selling Expense{formData.selling_expense_category && ` (${formData.selling_expense_category})`}:</span>
                    <span>₹{formData.selling_expense_amount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                  </div>
                )}
                {formData.profit_amount !== 0 && (
                  <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2">
                    <span>Net Profit:</span>
                    <span className={formData.profit_amount > 0 ? 'text-green-600' : 'text-red-600'}>
                      ₹{formData.profit_amount.toLocaleString('en-IN', {minimumFractionDigits: 2})}
                    </span>
                  </div>
                )}
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
                  {editingId ? 'Update Sale' : 'Add Sale'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Sales
