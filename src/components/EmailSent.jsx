// EmailSent.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../estilos/EmailSent.css';

function EmailSent() {
  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();
    // Lógica para procesar el código ingresado si es necesario
    // Después de procesar, podrías redirigir a la página correspondiente
    // Por ahora, simplemente redirijamos a la página de createPassword
    navigate('/createPassword');
  };

  return (
    <div>
      <h1>Email Enviado</h1>
      <p>Se ha enviado un código a su correo electrónico. Por favor, ingréselo a continuación:</p>
      <form onSubmit={handleSubmit}>
        <label htmlFor="code">Código:</label>
        <input type="text" name="code" id="code" required />
        <div className="botones">
          <button type="submit">Enviar</button>
        </div>
      </form>
    </div>
  );
}

export default EmailSent;
