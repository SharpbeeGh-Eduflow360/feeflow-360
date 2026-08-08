import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { AuthProvider } from './lib/auth-context'
import { ProtectedRoute } from './components/ProtectedRoute'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import CompleteSchool from './pages/CompleteSchool'

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
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/complete-school" element={<CompleteSchool />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App