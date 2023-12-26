import React from 'react';
import '../estilos/ForgotPassword.css';
import { Link } from 'react-router-dom';

function ForgotPassword() {
  return (
    <div className='forgotPassword-container bg-dark text-light'>
      <h1>Olvidó su contraseña?</h1>
      <h2>Póngase en contacto con el administrador del servicio</h2>
      <Link className='backToHome' to="/">Ir a la página de inicio</Link>
    </div>
  );
}

export default ForgotPassword;
