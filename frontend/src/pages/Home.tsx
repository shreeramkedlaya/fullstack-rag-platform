import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ArrowRight, Zap, Shield, Globe } from 'lucide-react'

export default function Home() {
  const { user } = useAuth()

  return (
    <div className="min-h-[calc(100vh-5rem)] flex flex-col justify-center items-center relative overflow-hidden bg-slate-50 -mx-4 -mt-4 py-16">
      
      {/* Background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
      <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-8">
          Build Faster with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">FullStack</span>
        </h1>
        <p className="mt-4 text-xl md:text-2xl text-slate-600 max-w-2xl mx-auto mb-10">
          A premium architectural blueprint for scaling enterprise applications. Experience clean code, solid authentication, and rapid performance.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {user ? (
            <Link to="/customers" className="inline-flex items-center justify-center px-8 py-4 text-base font-medium rounded-full text-white bg-slate-900 hover:bg-slate-800 hover:-translate-y-1 transition-all duration-300 shadow-xl hover:shadow-2xl">
              Go to Dashboard
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          ) : (
            <Link to="/login" className="inline-flex items-center justify-center px-8 py-4 text-base font-medium rounded-full text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:-translate-y-1 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-purple-500/30">
              Sign In to Continue
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          )}
          {!user && (
             <a href="#features" className="inline-flex items-center justify-center px-8 py-4 text-base font-medium rounded-full text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm">
               Learn More
             </a>
          )}
        </div>
      </div>

      {/* Features Grid */}
      <div id="features" className="relative z-10 max-w-5xl mx-auto px-4 mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white/80 backdrop-blur-lg p-6 rounded-2xl shadow-sm border border-slate-200/50 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-4">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Lightning Fast</h3>
          <p className="text-slate-600">Built on Vite and modern React, delivering an instantaneous developer and user experience.</p>
        </div>
        <div className="bg-white/80 backdrop-blur-lg p-6 rounded-2xl shadow-sm border border-slate-200/50 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 mb-4">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Secure by Default</h3>
          <p className="text-slate-600">Session-based authentication with CSRF protection, rate limiting, and zero DB hit permissions.</p>
        </div>
        <div className="bg-white/80 backdrop-blur-lg p-6 rounded-2xl shadow-sm border border-slate-200/50 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
          <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center text-pink-600 mb-4">
            <Globe className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Modular Design</h3>
          <p className="text-slate-600">A clean separation of concerns on the backend translates to a decoupled and maintainable frontend.</p>
        </div>
      </div>
    </div>
  )
}
