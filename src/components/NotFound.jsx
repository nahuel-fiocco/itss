import React from 'react';
import { Link } from 'react-router-dom';
import '../estilos/NotFound.css';

function NotFound() {
  return (
    <div className="notfound-container">
      <h1>404 Not Found</h1>
      <p>La página que buscas no existe.</p>
      <Link to="/">Ir a la página de inicio</Link>
    </div>
  );
}

export default NotFound;
