import { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { Users, CheckCircle, XCircle, Clock, Mail, Calendar } from 'lucide-react'

const ADMIN_EMAIL = 'rakeshkanojia96@gmail.com'

function AdminUserManagement() {
  const { user: currentUser } = useUser()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  const isAdmin = currentUser?.emailAddresses[0]?.emailAddress === ADMIN_EMAIL

  useEffect(() => {
    if (isAdmin) {
      fetchUsers()
    }
  }, [isAdmin])

  const fetchUsers = async () => {
    try {
      // Fetch all users from Clerk
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${await currentUser.getToken()}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (userId) => {
    try {
      const token = await currentUser.getToken()
      await fetch(`/api/admin/users/${userId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      // Update user metadata in Clerk
      alert('User approved successfully!')
      fetchUsers()
    } catch (error) {
      console.error('Error approving user:', error)
      alert('Error approving user')
    }
  }

  const handleReject = async (userId) => {
    if (!confirm('Are you sure you want to reject this user? They will be banned from accessing the app.')) {
      return
    }

    try {
      const token = await currentUser.getToken()
      await fetch(`/api/admin/users/${userId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      alert('User rejected and banned')
      fetchUsers()
    } catch (error) {
      console.error('Error rejecting user:', error)
      alert('Error rejecting user')
    }
  }

  if (!isAdmin) {
    return null
  }

  const pendingUsers = users.filter(u => !u.approved && !u.rejected)
  const approvedUsers = users.filter(u => u.approved)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Users className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
          <p className="text-sm text-gray-500">Approve or reject user access requests</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">Loading users...</p>
        </div>
      ) : (
        <>
          {/* Pending Approvals */}
          {pendingUsers.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-yellow-600" />
                <h3 className="font-medium text-gray-900">Pending Approval ({pendingUsers.length})</h3>
              </div>
              <div className="space-y-3">
                {pendingUsers.map(user => (
                  <div key={user.id} className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </h4>
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                            Pending
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            {user.email}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(user.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleApprove(user.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(user.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Approved Users */}
          {approvedUsers.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <h3 className="font-medium text-gray-900">Approved Users ({approvedUsers.length})</h3>
              </div>
              <div className="space-y-2">
                {approvedUsers.map(user => (
                  <div key={user.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900 text-sm">
                            {user.firstName} {user.lastName}
                          </h4>
                          <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                            Active
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pendingUsers.length === 0 && approvedUsers.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No users to manage</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default AdminUserManagement
