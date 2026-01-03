import { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { Building2, User, CreditCard, Save, Check, Shield, ExternalLink } from 'lucide-react'
import { supabase } from '../lib/supabase'

const ADMIN_EMAIL = 'rakeshkanojia96@gmail.com'

function Settings() {
  const { user } = useUser()
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [backupLoading, setBackupLoading] = useState(false)
  
  const isAdmin = user?.emailAddresses[0]?.emailAddress === ADMIN_EMAIL
  
  const [formData, setFormData] = useState({
    business_name: '',
    owner_name: '',
    gst_number: '',
    email: '',
    phone: '',
    address: '',
    financial_year_start: 'April'
  })

  useEffect(() => {
    if (user) {
      setFormData({
        business_name: user.unsafeMetadata?.business_name || '',
        owner_name: user.unsafeMetadata?.owner_name || user.fullName || '',
        gst_number: user.unsafeMetadata?.gst_number || '',
        email: user.emailAddresses[0]?.emailAddress || '',
        phone: user.unsafeMetadata?.phone || '',
        address: user.unsafeMetadata?.address || '',
        financial_year_start: user.unsafeMetadata?.financial_year_start || 'April'
      })
    }
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setSaved(false)

    try {
      await user.update({
        unsafeMetadata: {
          business_name: formData.business_name,
          owner_name: formData.owner_name,
          gst_number: formData.gst_number,
          phone: formData.phone,
          address: formData.address,
          financial_year_start: formData.financial_year_start
        }
      })
      
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Error updating settings:', error)
      alert('Error updating settings: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadBackup = async () => {
    if (!user) {
      alert('You must be logged in to download a backup')
      return
    }

    try {
      setBackupLoading(true)

      const userId = user.id
      const tables = [
        'sales',
        'purchases',
        'expenses',
        'assets',
        'inventory',
        'sales_returns',
        'stock_movements',
        'expense_categories'
      ]

      const results = await Promise.all(
        tables.map((table) =>
          supabase
            .from(table)
            .select('*')
            .eq('user_id', userId)
        )
      )

      const backup = {
        generated_at: new Date().toISOString(),
        user_id: userId,
      }

      tables.forEach((tableName, index) => {
        const res = results[index]
        if (res.error) {
          throw new Error(`Error fetching ${tableName}: ${res.error.message}`)
        }
        backup[tableName] = res.data || []
      })

      const json = JSON.stringify(backup, null, 2)
      const blob = new Blob([json], { type: 'application/json;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const dateStr = new Date().toISOString().slice(0, 10)
      link.href = url
      link.setAttribute('download', `account-book-backup-${dateStr}.json`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error generating backup:', error)
      alert('Error generating backup: ' + error.message)
    } finally {
      setBackupLoading(false)
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="text-gray-600">Manage your business profile and preferences</p>
      </div>

      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
          <Check className="w-5 h-5 text-green-600" />
          <p className="text-green-800 font-medium">Settings saved successfully!</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 flex items-center">
            <Building2 className="w-5 h-5 mr-2" />
            Business Information
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Name *
              </label>
              <input
                type="text"
                value={formData.business_name}
                onChange={(e) => setFormData({...formData, business_name: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Owner Name *
              </label>
              <input
                type="text"
                value={formData.owner_name}
                onChange={(e) => setFormData({...formData, owner_name: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                placeholder="+91 98765 43210"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GST Number
              </label>
              <input
                type="text"
                value={formData.gst_number}
                onChange={(e) => setFormData({...formData, gst_number: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                placeholder="22AAAAA0000A1Z5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Financial Year Start
              </label>
              <select
                value={formData.financial_year_start}
                onChange={(e) => setFormData({...formData, financial_year_start: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              >
                <option value="January">January</option>
                <option value="April">April (GST Compliance)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
                placeholder="Enter your business address"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Admin Panel - Only visible to admin */}
      {isAdmin && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm border-2 border-blue-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Admin: User Management</h3>
              <p className="text-sm text-gray-600">Approve or reject user signups</p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-5 space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">How User Approval Works:</h4>
              <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                <li>New users sign up and see "Pending Approval" message</li>
                <li>You (admin) review users in Clerk Dashboard</li>
                <li>Approve users by setting their <code className="bg-blue-100 px-1 rounded">approved</code> metadata to <code className="bg-blue-100 px-1 rounded">true</code></li>
                <li>Approved users can immediately access the app</li>
              </ol>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-900 mb-3">To Approve/Reject Users:</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700 mb-2">Open Clerk Dashboard → Users tab</p>
                    <a
                      href="https://dashboard.clerk.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      Open Clerk Dashboard
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">Click on user → Scroll to "Metadata" section → Click "Public metadata"</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    3
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700 mb-2"><strong>To Approve:</strong> Add this JSON:</p>
                    <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-xs">
                      {`{ "approved": true }`}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-red-100 text-red-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    ✕
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700"><strong>To Reject:</strong> Click the 3-dot menu → Ban/Delete user</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Your account ({ADMIN_EMAIL}) is automatically approved and has admin privileges.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* App Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Application Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Version</p>
            <p className="font-semibold text-gray-900">1.0.0</p>
          </div>
          <div>
            <p className="text-gray-600">Database</p>
            <p className="font-semibold text-gray-900">Neon PostgreSQL (Cloud)</p>
          </div>
          <div>
            <p className="text-gray-600">Account Type</p>
            <p className="font-semibold text-gray-900">{isAdmin ? 'Administrator' : 'Standard'}</p>
          </div>
          <div>
            <p className="text-gray-600">Data Backup</p>
            <p className="font-semibold text-green-600">Automatic + Manual Export</p>
          </div>
        </div>
        <div className="mt-4">
          <button
            type="button"
            onClick={handleDownloadBackup}
            disabled={backupLoading}
            className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {backupLoading ? 'Preparing backup...' : 'Download JSON Backup'}
          </button>
          <p className="mt-2 text-xs text-gray-500">
            Exports your data from Sales, Purchases, Expenses, Assets, Inventory, Sales Returns, Stock Movements, and Expense Categories.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Settings
