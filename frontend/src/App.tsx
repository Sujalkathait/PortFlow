import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/AdminDashboard';
import { OperatorDashboard } from './pages/OperatorDashboard';

function App() {
  return (
    <AuthProvider><BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        
        {/* Admin Routes */}
        <Route path="/admin/*" element={<ProtectedRoute role="Admin"><AdminDashboard /></ProtectedRoute>} />
        
        {/* Operator Routes */}
        <Route path="/operator/*" element={<ProtectedRoute role="Operator"><OperatorDashboard /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter></AuthProvider>
  );
}

export default App;
