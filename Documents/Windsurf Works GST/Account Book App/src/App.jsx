import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { SignedIn, SignedOut, RedirectToSignIn, useUser } from '@clerk/clerk-react'
import { useEffect } from 'react'

// Pages
import Dashboard from './pages/Dashboard'
import Purchases from './pages/Purchases'
import Sales from './pages/Sales'
import SalesReturns from './pages/SalesReturns'
import Expenses from './pages/Expenses'
import Assets from './pages/Assets'
import Inventory from './pages/Inventory'
import Reports from './pages/Reports'
import Settings from './pages/Settings'

// Layout
import Layout from './components/Layout'
import { useAuthStore } from './store/authStore'

function App() {
  const { user: clerkUser, isLoaded } = useUser()
  const { setUser } = useAuthStore()

  useEffect(() => {
    if (isLoaded && clerkUser) {
      setUser({
        id: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress,
        fullName: clerkUser.fullName,
      })
    }
  }, [clerkUser, isLoaded, setUser])

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        <Route path="/*" element={
          <>
            <SignedIn>
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="purchases" element={<Purchases />} />
                  <Route path="sales" element={<Sales />} />
                  <Route path="sales-returns" element={<SalesReturns />} />
                  <Route path="expenses" element={<Expenses />} />
                  <Route path="assets" element={<Assets />} />
                  <Route path="inventory" element={<Inventory />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
              </Routes>
            </SignedIn>
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          </>
        } />
      </Routes>
    </Router>
  )
}

export default App
