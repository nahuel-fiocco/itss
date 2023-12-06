import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Login from './components/Login';
import ForgotPassword from './components/ForgotPassword';
import NotFound from './components/NotFound.jsx';
import EmailSent from './components/EmailSent.jsx';
import CreatePassword from './components/CreatePassword.jsx';
import Administrador from './components/Administrador.jsx';
import Tecnico from './components/Tecnico.jsx';
import Auditor from './components/Auditor.jsx';
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyCqM_HBfuxkvh43xgi65cuuRpeq-BaGGao",
  authDomain: "itss-ab511.firebaseapp.com",
  projectId: "itss-ab511",
  storageBucket: "itss-ab511.appspot.com",
  messagingSenderId: "349843522587",
  appId: "1:349843522587:web:a3064a9f3839bc3396e4be"
};

// Otros archivos de la aplicación están utilizando la instancia de la aplicación Firebase
const app = initializeApp(firebaseConfig);

function App() {

  const { currentUser } = useAuth();

  const getRedirectPath = () => {
    if (currentUser) {
      // Si el usuario está autenticado, redirige según su rol
      switch (currentUser.role) {
        case 'admin':
          return '/admin';
        case 'tecnico':
          return '/tecnico';
        case 'auditor':
          return '/auditor';
        default:
          return '/login';
      }
    }
    // Si no hay usuario autenticado, redirige a la página de inicio de sesión
    return '/login';
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Navigate to={getRedirectPath()} />} />
          <Route path="/login" element={<Login />} />
          <Route path='/admin' element={<Administrador />} />
          <Route path='/tecnico' element={<Tecnico />} />
          <Route path='/auditor' element={<Auditor />} />
          <Route path="/forgotpassword" element={<ForgotPassword />} />
          <Route path='/emailsent' element={<EmailSent />} />
          <Route path='/createpassword' element={<CreatePassword />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
