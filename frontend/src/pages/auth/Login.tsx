import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from '../../http';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { LogIn, RefreshCw } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { fetchUser } = useAuth()
  const [email, setEmail] = useState('test@123.com')
  const [password, setPassword] = useState('test@123')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [captchaId, setCaptchaId] = useState('');
  const [captchaImage, setCaptchaImage] = useState('');
  const [captchaValue, setCaptchaValue] = useState('');

  const fetchCaptcha = async () => {
    try {
      const res = await axios.get(`/auth/captcha`)
      setCaptchaId(res.data.captcha_id)
      setCaptchaImage(res.data.image);
      setCaptchaValue('')
    } catch (err: any) {
      console.log('failed to fetch CAPTCHA', err)
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message)
      } else {
        setError('Failed to load CAPTCHA. Please check your connection.')
      }
    }
  }

  useEffect(() => {
    fetchCaptcha();
  }, [])

  const handleLogin = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Send login request to the auth endpoint
      const response = await axios.post(`/auth/login/`, {
        email,
        password,
        captcha_id: captchaId,
        captcha_value: captchaValue
      })

      // Unconditionally set the refresh tracking timestamp
      localStorage.setItem('access_exp', response.data.access_exp.toString())
      await fetchUser()
      // On success, redirect to the customers dashboard
      navigate('/customers')
    } catch (err: any) {
      console.log(err)
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message)
      } else {
        setError('An error occurred during login. Please try again.')
      }
      fetchCaptcha();
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-slate-200">
        <CardHeader className="space-y-1 pb-6 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight text-slate-900">Sign In</CardTitle>
          <p className="text-sm text-slate-500">Enter your email and password to access your account</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none text-slate-700">Email Address</label>
              <input
                type="email"
                required
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none text-slate-700">Password</label>
              <input
                type="password"
                required
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className='space-y-2'>
              <label className="text-sm font-medium text-slate-700">Security Check</label>
              <div className="flex items-center space-x-2">
                {captchaImage ? (
                  <img src={captchaImage} alt="CAPTCHA" className="h-12 border rounded-md shadow-sm" />
                ) : (
                  <div className="h-12 w-40 bg-slate-100 animate-pulse rounded-md" />
                )}
                <Button type="button" variant="outline" size="icon" onClick={fetchCaptcha} className="h-12 w-12">
                  <RefreshCw className="w-5 h-5 text-slate-600" />
                </Button>
              </div>

              <input
                type="text"
                required
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-slate-400 focus:border-transparent uppercase"
                placeholder="Enter the code above"
                value={captchaValue}
                onChange={(e) => setCaptchaValue(e.target.value.toUpperCase())}
              />

            </div>
            {error && (
              <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md border border-red-100">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full mt-6" disabled={loading}>
              <LogIn className="w-4 h-4 mr-2" />
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
            
            <div className="mt-4 text-center text-sm text-slate-500">
              Don't have an account?{' '}
              <Link to="/signup" className="font-medium text-slate-900 hover:underline">
                Sign up
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
