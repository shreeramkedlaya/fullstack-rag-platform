import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './src/components/Layout'
import ProtectedRoute from './src/components/ProtectedRoute'
import Home from './src/pages/Home'
import NoteDetail from './src/pages/NoteDetail'
import Notes from './src/pages/Notes'
import Customers from './src/pages/Customers/Customers'
import CustomerDetail from './src/pages/Customers/CustomerDetail'
import Login from './src/pages/auth/Login'
import Signup from './src/pages/auth/Signup'
import LoginHistory from './src/pages/auth/LoginHistory'

import Settings from './src/pages/auth/Settings'
import Users from './src/pages/Admin/Users'
import ChatWidget from './src/components/chat-widget/ChatWidget'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/login' element={<Login />} />
        <Route path='/signup' element={<Signup />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path='/' element={<Home />} />
            <Route path='/settings' element={<Settings />} />
            <Route path='/audit-log' element={<LoginHistory />} />
            <Route path='/admin/users' element={<Users />} />
            <Route path='/notes' element={<Notes />}>
              <Route path=':id' element={<NoteDetail />} />
            </Route>
            <Route path='/customers' element={<Customers />} />
            <Route path='/customers/:id' element={<CustomerDetail />} />
            <Route path='*' element={<div className='p-10 text-center'>404: Page not found</div>} />
          </Route>
        </Route>
      </Routes>
      <ChatWidget />
    </BrowserRouter>
  )
}
