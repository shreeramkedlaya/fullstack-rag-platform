import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import { Settings, LogOut, ChevronDown } from 'lucide-react'

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()

  const { user, logout } = useAuth()

  const navItems = [
    { name: 'Notes', path: '/notes' },
    { name: 'Customers', path: '/customers' },
  ]

  if (user?.role === 'admin') {
    navItems.push({ name: 'System Users', path: '/admin/users' })
    navItems.push({ name: 'Audit Log', path: '/audit-log' })
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="font-bold text-xl text-slate-800 tracking-tight hover:text-slate-600 transition-colors">FullStack App</Link>
          <nav className="flex items-center space-x-1">
            {user && navItems.map((item) => {
              const isActive = location.pathname === item.path ||
                (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                >
                  {item.name}
                </Link>
              )
            })}
            {user && <div className="h-6 w-px bg-slate-200 mx-2"></div>}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center space-x-2 px-3 py-1.5 rounded-md hover:bg-slate-100 transition-colors focus:outline-none outline-none">
                  <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                    {user.email.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-slate-700 hidden sm:inline-block">{user.email}</span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mt-1">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1.5 py-1">
                      <p className="text-sm font-medium leading-none text-slate-900">My Account</p>
                      <p className="text-xs leading-none text-slate-500 truncate">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer py-2">
                    <Settings className="mr-2 h-4 w-4 text-slate-500" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 cursor-pointer py-2">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 rounded-md text-sm font-medium bg-slate-900 text-white hover:bg-slate-800 transition-colors"
              >
                Login
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1 w-full max-w-6xl mx-auto p-4">
        <Outlet />
      </main>
    </div>
  )
}
