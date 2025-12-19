import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useClerk, useUser } from '@clerk/clerk-react'
import { useFinancialYearStore } from '../store/financialYearStore'
import { 
  LayoutDashboard, 
  ShoppingCart, 
  TrendingUp, 
  RotateCcw,
  Receipt, 
  Laptop,
  Package,
  FileText, 
  Settings, 
  LogOut,
  Menu,
  X,
  BookOpen,
  ChevronDown
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

function Layout() {
  const { signOut } = useClerk()
  const { user } = useUser()
  const { financialYear, financialYears, setFinancialYear } = useFinancialYearStore()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showFYDropdown, setShowFYDropdown] = useState(false)
  const fyDropdownRef = useRef(null)
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (fyDropdownRef.current && !fyDropdownRef.current.contains(event.target)) {
        setShowFYDropdown(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const navigation = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Purchases', path: '/purchases', icon: ShoppingCart },
    { name: 'Sales', path: '/sales', icon: TrendingUp },
    { name: 'Sales Returns', path: '/sales-returns', icon: RotateCcw },
    { name: 'Expenses', path: '/expenses', icon: Receipt },
    { name: 'Assets', path: '/assets', icon: Laptop },
    { name: 'Inventory', path: '/inventory', icon: Package },
    { name: 'Reports', path: '/reports', icon: FileText },
    { name: 'Settings', path: '/settings', icon: Settings },
  ]

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900">Account Book</h1>
                <p className="text-xs text-gray-500">E-commerce</p>
              </div>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-primary text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </NavLink>
              )
            })}
          </nav>

          {/* User info and logout */}
          <div className="border-t border-gray-200 p-4">
            <div className="px-4 py-3 bg-gray-50 rounded-lg mb-2">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.unsafeMetadata?.business_name || 'Business'}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.emailAddresses[0]?.emailAddress}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-4 lg:px-8 py-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <div className="flex-1 lg:flex-none">
              <h2 className="text-xl font-bold text-gray-900">
                {navigation.find(n => n.path === location.pathname)?.name || 'Account Book'}
              </h2>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative" ref={fyDropdownRef}>
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.fullName || user?.emailAddresses[0]?.emailAddress || 'User'}
                  </p>
                  <button
                    onClick={() => setShowFYDropdown(!showFYDropdown)}
                    className="flex items-center space-x-1 text-xs text-gray-500 hover:text-primary transition-colors"
                  >
                    <span>FY {financialYear}</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>

                {/* FY Dropdown */}
                {showFYDropdown && (
                  <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    {financialYears.map((fy) => (
                      <button
                        key={fy.value}
                        onClick={() => {
                          setFinancialYear(fy.value)
                          setShowFYDropdown(false)
                        }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                          financialYear === fy.value
                            ? 'bg-primary text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        FY {fy.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout
