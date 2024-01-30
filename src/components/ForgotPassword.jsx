import React from 'react';
import '../estilos/ForgotPassword.css';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRightToBracket } from '@fortawesome/free-solid-svg-icons';

function ForgotPassword() {
  return (
    <div className='forgotPassword-container text-center bg-dark text-light'>
      <h1>¿Olvidaste su contraseña?</h1>
      <h3>Por favor contactate con el administrador del servicio</h3>
      <button>
        <FontAwesomeIcon icon={faArrowRightToBracket} style={{ transform: 'rotate(180deg)' }} />
        <Link className='link text-dark' to="/login">Volver al login</Link>
      </button>
    </div>
  );
}

export default ForgotPassword;
