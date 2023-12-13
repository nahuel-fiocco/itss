import React from 'react';
import { Link } from 'react-router-dom';
import '../estilos/NotFound.css';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

function NotFound() {

  const { currentUser } = useAuth();

  if (!currentUser) {
    Navigate('/login');
    return null;
  }

  return (
    <div className="notfound-container">
      <h1>404 Not Found</h1>
      <p>La página que buscas no existe.</p>
      <Link to="/">Ir a la página de inicio</Link>
    </div>
  );
}

export default NotFound;
