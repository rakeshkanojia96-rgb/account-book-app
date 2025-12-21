import { useUser } from '@clerk/clerk-react'
import { Clock, Mail, AlertCircle } from 'lucide-react'

function PendingApproval() {
  const { user } = useUser()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Account Pending Approval
          </h1>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-left">
                <p className="text-sm text-yellow-800 font-medium mb-1">
                  Your account is under review
                </p>
                <p className="text-xs text-yellow-700">
                  An administrator will review your signup request shortly. You'll receive an email once your account is approved.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Account Email:</span>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="font-medium text-gray-900">
                  {user?.emailAddresses[0]?.emailAddress}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm mt-3">
              <span className="text-gray-600">Status:</span>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                Pending Approval
              </span>
            </div>
          </div>

          <p className="text-sm text-gray-500 mb-4">
            This usually takes less than 24 hours. Check your email for updates.
          </p>

          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh Status
          </button>

          <button
            onClick={() => {
              if (confirm('Are you sure you want to sign out?')) {
                window.location.href = '/sign-out'
              }
            }}
            className="w-full mt-3 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}

export default PendingApproval
