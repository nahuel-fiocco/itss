import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Login from './components/Login';
import ForgotPassword from './components/ForgotPassword';
import NotFound from './components/NotFound.jsx';
import Administrador from './components/Administrador.jsx';
import Tecnico from './components/Tecnico.jsx';
import Auditor from './components/Auditor.jsx';
import { initializeApp } from "firebase/app";
import Navbar from './components/NavBar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

const firebaseConfig = {
  apiKey: "AIzaSyCqM_HBfuxkvh43xgi65cuuRpeq-BaGGao",
  authDomain: "itss-ab511.firebaseapp.com",
  projectId: "itss-ab511",
  storageBucket: "itss-ab511.appspot.com",
  messagingSenderId: "349843522587",
  appId: "1:349843522587:web:a3064a9f3839bc3396e4be"
};

const app = initializeApp(firebaseConfig);

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
          return '/login';
      }
    }
    return '/login';
  };

  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path='/admin' element={<ProtectedRoute element={<Administrador />} allowedRoles={['administrador']} />} />
        <Route path='/tecnico' element={<ProtectedRoute element={<Tecnico />} allowedRoles={['tecnico']} />} />
        <Route path='/auditor' element={<ProtectedRoute element={<Auditor />} allowedRoles={['auditor']} />} />
        <Route path='/login' element={<Login />} />
        <Route path='/forgot-password' element={<ForgotPassword />} />
        <Route path='/' element={<Navigate to={getRedirectPath()} />} />
        <Route path='*' element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
