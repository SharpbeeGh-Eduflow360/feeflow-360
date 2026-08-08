import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { AuthProvider } from './lib/auth-context'
import { ThemeProvider } from './lib/theme-context'
import { ProtectedRoute } from './components/ProtectedRoute'
import { ThemeToggle } from './components/ThemeToggle'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import CompleteSchool from './pages/CompleteSchool'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <nav className="p-4 flex items-center justify-between border-b">
            <div className="flex gap-4">
              <Link to="/" className="text-blue-600 font-medium">Home</Link>
              <Link to="/dashboard" className="text-blue-600 font-medium">Dashboard</Link>
              <Link to="/login" className="text-blue-600 font-medium">Login</Link>
            </div>
            <ThemeToggle />
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
    </ThemeProvider>
  )
}

export default App