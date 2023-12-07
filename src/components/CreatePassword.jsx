import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Importa los estilos de react-toastify
import '../estilos/CreatePassword.css';

function CreatePassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();

    // Verifica si las contraseñas coinciden
    if (password === confirmPassword) {
      // Aquí puedes agregar la lógica para enviar la contraseña al servidor o almacenarla localmente
      console.log('Contraseña creada:', password);

      // Muestra una notificación de éxito con react-toastify
      toast.success('Contraseña creada exitosamente', {
        position: toast.POSITION.TOP_CENTER,
        autoClose: 3000, // Cierra la notificación automáticamente después de 3000 milisegundos (3 segundos)
      });

      // Redirige a la página de inicio de sesión
      navigate('/login');
    } else {
      // Muestra una notificación de error con react-toastify
      toast.error('Las contraseñas no coinciden. Por favor, inténtalo de nuevo.', {
        position: toast.POSITION.TOP_CENTER,
        autoClose: 3000,
      });
    }
  };

  return (
    <div>
      <h1>Crear Contraseña</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="password">Contraseña:</label>
        <input
          type="password"
          name="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <label htmlFor="confirmPassword">Confirmar Contraseña:</label>
        <input
          type="password"
          name="confirmPassword"
          id="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <div className="botones">
          <button type="submit">Crear Contraseña</button>
        </div>
      </form>
    </div>
  );
}

export default CreatePassword;
