import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/admin/Login'
import Dashboard from './pages/admin/Dashboard'
import MenuManager from './pages/admin/MenuManager'
import ContentManager from './pages/admin/ContentManager'
import NoticeManager from './pages/admin/NoticeManager'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './contexts/AuthContext'
import { MobileProvider } from './contexts/MobileContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MobileProvider>
      <AuthProvider>
        <HashRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/menus" element={
              <ProtectedRoute>
                <MenuManager />
              </ProtectedRoute>
            } />
            <Route path="/content" element={
              <ProtectedRoute>
                <ContentManager />
              </ProtectedRoute>
            } />
            <Route path="/notice" element={
              <ProtectedRoute>
                <NoticeManager />
              </ProtectedRoute>
            } />
          </Routes>
        </HashRouter>
      </AuthProvider>
    </MobileProvider>
  </React.StrictMode>,
) 