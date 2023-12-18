import React, { useState, useEffect } from 'react';
import { getFirestore, collection, doc, getDoc, setDoc, getDocs, query, orderBy, limit, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { css } from '@emotion/react';
import { BarLoader } from 'react-spinners';
import '../estilos/Tecnico.css';

function Tecnico() {
  const [loading, setLoading] = useState(true);
  const [nroConforme, setNroConforme] = useState(null);
  const [tecnico, setTecnico] = useState('');
  const [horaComienzo, setHoraComienzo] = useState('');
  const [horaFinalizacion, setHoraFinalizacion] = useState('');
  const [tipoTarea, setTipoTarea] = useState('');
  const [detalleTareas, setDetalleTareas] = useState('');
  const [cantidadHoras, setCantidadHoras] = useState('');
  const [historialHoras, setHistorialHoras] = useState([]);
  const [expanded, setExpanded] = useState('collapseOne');
  const [view, setView] = useState('welcome'); // 'welcome', 'form', 'history'
  const { currentUser } = useAuth();
  const [fechaConforme, setFechaConforme] = useState('');
  const [confirmacionVisible, setConfirmacionVisible] = useState(false);
  const [errorMensaje, setErrorMensaje] = useState('');
  const [contentLoaded, setContentLoaded] = useState(false);

  if (!currentUser) {
    Navigate('/login');
    return null;
  }

  const handleEliminarConforme = async (nroConforme) => {
    try {
      const db = getFirestore();
      const conformesDocRef = doc(collection(db, 'horas'), nroConforme);
      await deleteDoc(conformesDocRef);
      setHistorialHoras((prevHistorialHoras) => prevHistorialHoras.filter((hora) => hora.nroConforme !== nroConforme));
    } catch (error) {
      console.error('Error eliminando conformes:', error);
    }
  };

  const handleFechaConformeChange = (event) => {
    setFechaConforme(event.target.value);
  };

  useEffect(() => {
    // ... (otras importaciones y configuraciones)

    const obtenerDatosIniciales = async () => {
      try {
        const db = getFirestore();
        const userDoc = doc(collection(db, 'users'), currentUser.uid);
        const userSnapshot = await getDoc(userDoc);

        if (userSnapshot.exists()) {
          const userData = userSnapshot.data();
          const nombreTecnico = `${userData.name}`;
          const apellidoTecnico = `${userData.surname}`;
          const Tecnico = `${apellidoTecnico}, ${nombreTecnico}`;
          setTecnico(Tecnico);
        }

        const horasCollectionRef = collection(db, 'horas');
        const horasQuery = await getDocs(query(horasCollectionRef, orderBy('nroConforme', 'desc'), limit(1)));

        if (horasQuery.docs.length > 0) {
          const ultimoNroConforme = parseInt(horasQuery.docs[0].data().nroConforme, 10);
          const nuevoNroConforme = String(ultimoNroConforme + 1).padStart(6, '0');
          setNroConforme(nuevoNroConforme);
        } else {
          setNroConforme('000001');
        }

        const historialQuery = await getDocs(query(horasCollectionRef, orderBy('fechaCreacion', 'desc')));
        const historialData = historialQuery.docs.map((doc) => doc.data());
        setHistorialHoras(historialData);

        setLoading(false);
        setContentLoaded(true);  // Indica que los datos han sido cargados
      } catch (error) {
        console.error('Error obteniendo datos iniciales:', error);
        setLoading(false);
      }
    };

    // ... (resto del código)


    obtenerDatosIniciales();
  }, [currentUser]);

  const handleHoraComienzoChange = (event) => {
    setHoraComienzo(event.target.value);
    calcularCantidadHoras(event.target.value, horaFinalizacion);
  };

  const handleHoraFinalizacionChange = (event) => {
    setHoraFinalizacion(event.target.value);
    calcularCantidadHoras(horaComienzo, event.target.value);
  };

  const calcularCantidadHoras = (horaInicio, horaFin) => {
    const horaInicioArray = horaInicio.split(':');
    const horaFinArray = horaFin.split(':');

    const inicio = new Date(0, 0, 0, horaInicioArray[0], horaInicioArray[1]);
    const fin = new Date(0, 0, 0, horaFinArray[0], horaFinArray[1]);

    const diferenciaEnMilisegundos = fin.getTime() - inicio.getTime();
    const horasTrabajadas = diferenciaEnMilisegundos / (1000 * 60 * 60);

    const formato24Horas = (hours) => {
      const roundedHours = Math.floor(hours);
      const minutes = (hours - roundedHours) * 60;
      return `${roundedHours.toString().padStart(2, '0')}:${Math.round(minutes).toString().padStart(2, '0')}`;
    };

    setCantidadHoras(formato24Horas(horasTrabajadas));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Verificar que los campos obligatorios estén llenos
    if (!horaComienzo || !horaFinalizacion || !tipoTarea || !detalleTareas || !fechaConforme) {
      // Mostrar mensaje de error al usuario
      setErrorMensaje('Por favor, completa todos los campos obligatorios.');

      // Ocultar el mensaje después de 2 segundos
      setTimeout(() => {
        setErrorMensaje('');
      }, 2000);

      return;
    }

    const db = getFirestore();
    const fechaCreacion = new Date().toLocaleDateString();
    const horaCreacion = new Date().toLocaleTimeString();
    const horaDocRef = doc(db, 'horas', nroConforme);

    await setDoc(horaDocRef, {
      nroConforme,
      tecnico,
      horaComienzo,
      horaFinalizacion,
      cantidadHoras,
      tipoTarea,
      detalleTareas,
      fechaCreacion,
      horaCreacion,
      fechaConforme,
    });

    setConfirmacionVisible(true);
    limpiarFormulario();
    setNroConforme((prevNroConforme) => String(parseInt(prevNroConforme, 10) + 1).padStart(6, '0'));

    setTimeout(() => {
      setConfirmacionVisible(false);
    }, 5000);
  };


  const limpiarFormulario = () => {
    setHoraComienzo('');
    setHoraFinalizacion('');
    setTipoTarea('');
    setDetalleTareas('');
    setCantidadHoras('');
  };

  const cambiarVista = async (opcion) => {
    setView(opcion);

    if (opcion === 'history') {
      // Si estamos cambiando a la vista de historial, volvemos a cargar los conformes
      try {
        const db = getFirestore();
        const horasCollectionRef = collection(db, 'horas');
        const historialQuery = await getDocs(query(horasCollectionRef, orderBy('fechaCreacion', 'desc')));
        const historialData = historialQuery.docs.map((doc) => doc.data());
        setHistorialHoras(historialData);
      } catch (error) {
        console.error('Error obteniendo historial:', error);
      }
    }
  };

  const renderFormulario = () => (
    <div className="camposycontenido">
      <div className="campos">
        <label className="label">Nro. Conforme</label>
        <label className="label">Técnico</label>
        <label className="label">Fecha Conforme</label>
        <label className="label">Hora Comienzo</label>
        <label className="label">Hora Finalización</label>
        <label className="label">Cantidad de Horas</label>
        <label className="label">Tipo de Tarea</label>
        <label className="label">Detalle de Tareas</label>
      </div>
      <div className="contenido">
        <label className="label">{nroConforme}</label>
        <label className="label">{tecnico}</label>
        <input type="date" value={fechaConforme} onChange={handleFechaConformeChange} required />
        <input type="time" value={horaComienzo} onChange={handleHoraComienzoChange} required />
        <input type="time" value={horaFinalizacion} onChange={handleHoraFinalizacionChange} required />
        <div className="empty-space"></div>
        <label className="label">{cantidadHoras}</label>
        <select value={tipoTarea} onChange={(e) => setTipoTarea(e.target.value)} required>
          <option value="">Selecciona...</option>
          <option value="correctivo">Correctivo</option>
          <option value="preventivo">Preventivo</option>
          <option value="ambas">Ambas</option>
        </select>
        <textarea value={detalleTareas} onChange={(e) => setDetalleTareas(e.target.value)} required />
      </div>
    </div>
  );

  const renderHistorial = () => (
    <div className="historial-container">
      <h3>Historial de Horas</h3>
      <div className="historial-desktop">
        <table>
          <thead>
            <tr>
              <th>Nro. Conforme</th>
              <th>Técnico</th>
              <th>Hora Comienzo</th>
              <th>Hora Finalización</th>
              <th>Cantidad de Horas</th>
              <th>Tipo de Tarea</th>
              <th>Detalle de Tareas</th>
              <th>Fecha de Creación</th>
              <th>Hora de Creación</th>
              <th>Eliminar</th>
            </tr>
          </thead>
          <tbody>
            {historialHoras.map((hora) => (
              <tr key={hora.nroConforme}>
                <td>{hora.nroConforme}</td>
                <td>{hora.tecnico}</td>
                <td>{hora.horaComienzo}</td>
                <td>{hora.horaFinalizacion}</td>
                <td>{hora.cantidadHoras}</td>
                <td>{hora.tipoTarea}</td>
                <td>{hora.detalleTareas}</td>
                <td>{hora.fechaCreacion}</td>
                <td>{hora.horaCreacion}</td>
                <td>
                  <button onClick={() => handleEliminarConforme(hora.nroConforme)}>
                    <i className="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="historial-mobile">
        <div className="accordion" id="historialAcordeon">
          {historialHoras.map((hora) => (
            <div className="accordion-item bg-dark text-light" key={hora.nroConforme}>
              <h2 className="accordion-header" id={`heading${hora.nroConforme}`}>
                <button
                  className="accordion-button bg-dark text-light"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target={`#collapse${hora.nroConforme}`}
                  aria-expanded="false"
                  aria-controls={`collapse${hora.nroConforme}`}
                >
                  {hora.nroConforme}
                </button>
              </h2>
              <div
                id={`collapse${hora.nroConforme}`}
                className="accordion-collapse collapse"
                aria-labelledby={`heading${hora.nroConforme}`}
                data-bs-parent="#historialAcordeon"
              >
                <div className="accordion-body">
                  <p><strong>Técnico:</strong> {hora.tecnico}</p>
                  <p><strong>Hora Comienzo:</strong> {hora.horaComienzo}</p>
                  <p><strong>Hora Finalización:</strong> {hora.horaFinalizacion}</p>
                  <p><strong>Cantidad de Horas:</strong> {hora.cantidadHoras}</p>
                  <p><strong>Tipo de Tarea:</strong> {hora.tipoTarea}</p>
                  <p><strong>Detalle de Tareas:</strong> {hora.detalleTareas}</p>
                  <p><strong>Fecha de Creación:</strong> {hora.fechaCreacion}</p>
                  <p><strong>Hora de Creación:</strong> {hora.horaCreacion}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const toggleAcordeon = (nroConforme) => {
    setExpanded((prevExpanded) => (prevExpanded === nroConforme ? null : nroConforme));
  };

  return (
    <div>
      {loading ? (
        <div className="spinner-container bg-dark text-light">
          <Spinner />
          <p>Cargando...</p>
        </div>
      ) : (
        <div className='tecnico-container bg-dark text-light'>
          <h2>Bienvenido, {tecnico.split(', ')[1]}</h2>
          <div className="botones">
            <button className='botones-vistas' onClick={() => cambiarVista('form')}>➕ Agregar horas</button>
            <button className='botones-vistas' onClick={() => cambiarVista('history')}>📝 Ver historial</button>
          </div>
          {confirmacionVisible && (
            <div className="mensaje-confirmacion">
              {`Conforme nro ${nroConforme - 1} cargado`}
            </div>
          )}
          {view === 'form' && (
            <>
              {renderFormulario()}
              {errorMensaje && (
                <div className="mensaje-error bg-danger text-light rounded p-1 mb-5">
                  {errorMensaje}
                </div>
              )}
              <form id="form-tecnico" className='mb-5' onSubmit={handleSubmit}>
                <button type="submit">Guardar</button>
                <button type="button" onClick={limpiarFormulario}>Limpiar</button>
              </form>
            </>
          )}
          {view === 'history' && renderHistorial()}
        </div>
      )}
    </div>
  );

}

const Spinner = () => {
  const override = css`
    display: block;
    margin: 0 auto;
  `;

  return <BarLoader color="#36D7B7" loading css={override} />;
};

export default Tecnico;
