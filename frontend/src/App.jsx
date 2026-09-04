import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/common/Layout';
import Dashboard from './pages/Dashboard';
import KudosWall from './pages/KudosWall';
import RetroBoard from './pages/RetroBoard';
import PokerRoom from './pages/PokerRoom';
import RouletteRoom from './pages/RouletteRoom';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If guest tries to access protected features, send to poker
    return <Navigate to="/poker" replace />;
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
            
            {/* Protected Routes wrapped in Layout */}
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              {/* Dashboard, Kudos, Retro are for admin/members only */}
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={
                <ProtectedRoute allowedRoles={['admin', 'member']}><Dashboard /></ProtectedRoute>
              } />
              <Route path="kudos" element={
                <ProtectedRoute allowedRoles={['admin', 'member']}><KudosWall /></ProtectedRoute>
              } />
              <Route path="retro" element={
                <ProtectedRoute allowedRoles={['admin', 'member']}><RetroBoard /></ProtectedRoute>
              } />
              
              {/* Poker is open to guests as well */}
              <Route path="poker" element={<PokerRoom />} />
              
              <Route path="roulette" element={
                <ProtectedRoute allowedRoles={['admin', 'member']}><RouletteRoom /></ProtectedRoute>
              } />
            </Route>
            
          </Routes>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
};

export default App;
