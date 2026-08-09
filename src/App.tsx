import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './lib/auth-context'
import { ThemeProvider } from './lib/theme-context'
import { ProtectedRoute } from './components/ProtectedRoute'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import CompleteSchool from './pages/CompleteSchool'
import Onboarding from './pages/Onboarding'
import Settings from './pages/Settings'
import TermExpired from './pages/TermExpired'
import Students from './pages/Students'
import AddStudent from './pages/AddStudent'
import StudentDetail from './pages/StudentDetail'
import ImportStudents from './pages/ImportStudents'
import PromoteStudents from './pages/PromoteStudents'
import FeeCategories from './pages/FeeCategories'
// ...

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/complete-school" element={<CompleteSchool />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route path="/term-expired" element={<TermExpired />} />
            <Route
  path="/students"
  element={
    <ProtectedRoute>
      <Students />
    </ProtectedRoute>
  }
/>
            <Route
  path="/students/new"
  element={
    <ProtectedRoute>
      <AddStudent />
    </ProtectedRoute>
  }
/>
            <Route
  path="/students/:id"
  element={
    <ProtectedRoute>
      <StudentDetail />
    </ProtectedRoute>
  }
/>
            <Route
  path="/students/import"
  element={
    <ProtectedRoute>
      <ImportStudents />
    </ProtectedRoute>
  }
/>
            <Route
  path="/students/promote"
  element={
    <ProtectedRoute>
      <PromoteStudents />
    </ProtectedRoute>
  }
/>
            <Route
  path="/fee-categories"
  element={
    <ProtectedRoute>
      <FeeCategories />
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