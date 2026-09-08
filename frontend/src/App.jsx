import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/common/Layout';
import Dashboard from './pages/Dashboard';
import KudosWall from './pages/KudosWall';
import RetroBoard from './pages/RetroBoard';
import PokerRoom from './pages/PokerRoom';
import RouletteRoom from './pages/RouletteRoom';
import Login from './pages/Login';
import PendingAccess from './pages/PendingAccess';
import AdminArea from './pages/AdminArea';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  const location = useLocation();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (user.role !== 'guest' && (user.status === 'pending' || user.status === 'rejected') && location.pathname !== '/pending') {
    // If user is a global admin, they can bypass the pending screen ONLY to access /admin
    if (user.role === 'admin' && location.pathname === '/admin') {
      // allow
    } else {
      return <Navigate to="/pending" replace />;
    }
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If guest tries to access protected features, send to poker
    // Or if normal user tries to access admin
    if (user.role === 'guest') return <Navigate to="/poker" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const App = () => {
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/pending" element={
              <ProtectedRoute allowedRoles={['user', 'admin']}><PendingAccess /></ProtectedRoute>
            } />
            
            {/* Protected Routes wrapped in Layout */}
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              {/* Dashboard, Kudos, Retro are for admin/user only */}
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={
                <ProtectedRoute allowedRoles={['admin', 'user']}><Dashboard /></ProtectedRoute>
              } />
              <Route path="kudos" element={
                <ProtectedRoute allowedRoles={['admin', 'user']}><KudosWall /></ProtectedRoute>
              } />
              <Route path="retro" element={
                <ProtectedRoute allowedRoles={['admin', 'user']}><RetroBoard /></ProtectedRoute>
              } />
              
              {/* Poker is open to guests as well */}
              <Route path="poker" element={<PokerRoom />} />
              
              <Route path="roulette" element={
                <ProtectedRoute allowedRoles={['admin', 'user']}><RouletteRoom /></ProtectedRoute>
              } />

              <Route path="admin" element={
                <ProtectedRoute allowedRoles={['admin']}><AdminArea /></ProtectedRoute>
              } />
            </Route>
            
          </Routes>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
};

export default App;
