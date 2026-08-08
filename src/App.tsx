import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { AuthProvider } from './lib/auth-context'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <nav className="p-4 flex gap-4 border-b">
          <Link to="/" className="text-blue-600 font-medium">Home</Link>
          <Link to="/dashboard" className="text-blue-600 font-medium">Dashboard</Link>
          <Link to="/login" className="text-blue-600 font-medium">Login</Link>
        </nav>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App