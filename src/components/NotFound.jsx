// NotFound.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './NotFound.css';

function NotFound() {
  return (
    <div className="container">
      <h1>404 Not Found</h1>
      <p>La página que buscas no existe.</p>
      <Link to="/">Ir a la página de inicio</Link>
      {/* Puedes agregar una imagen personalizada para hacerlo más amigable */}
      {/* <img src="/path/to/custom-image.png" alt="Custom 404 Image" /> */}
    </div>
  );
}

export default NotFound;
