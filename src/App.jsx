import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Login from './components/Login.jsx';
import ForgotPassword from './components/ForgotPassword.jsx';
import NotFound from './components/NotFound.jsx';
import Administrador from './components/Administrador.jsx';
import Tecnico from './components/Tecnico.jsx';
import Auditor from './components/Auditor.jsx';
import Navbar from './components/NavBar.jsx';
import firebaseApp from './firebase'; // Importas aquí la inicialización de Firebase

function App() {
  const { currentUser } = useAuth();

  const getRedirectPath = () => {
    if (currentUser) {
      switch (currentUser.role) {
        case 'administrador':
          return '/admin';
        case 'tecnico':
          return '/tecnico';
        case 'auditor':
          return '/auditor';
        default:
          return '/';
      }
    }
    return '/login';
  };

  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to={getRedirectPath()} />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgotPassword" element={<ForgotPassword />} />
        <Route path="/admin" element={<Administrador />} />
        <Route path="/tecnico" element={<Tecnico />} />
        <Route path="/auditor" element={<Auditor />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
