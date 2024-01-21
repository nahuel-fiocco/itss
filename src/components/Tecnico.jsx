import React, { useState, useEffect } from 'react';
import { getFirestore, collection, doc, getDoc, setDoc, getDocs, query, orderBy, limit, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { css } from '@emotion/react';
import { BarLoader } from 'react-spinners';
import '../estilos/Tecnico.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { OverlayTrigger, Popover, Table } from 'react-bootstrap';

function Tecnico() {
  const [loading, setLoading] = useState(true);
  const [nroConforme, setNroConforme] = useState(null);
  const [tecnico, setTecnico] = useState('');
  const [horaComienzo, setHoraComienzo] = useState('');
  const [horaFinalizacion, setHoraFinalizacion] = useState('');
  const [tipoTarea, setTipoTarea] = useState('');
  const [detalleTareas, setDetalleTareas] = useState('');
  const [cantidadHoras, setCantidadHoras] = useState('');
  const [historialHoras, setHistorialHoras] = useState([
    {
      nroConforme: '',
      tecnico: '',
      horaComienzo: '',
      horaFinalizacion: '',
      cantidadHoras: '',
      tipoTarea: '',
      detalleTareas: '',
      fechaCreacion: '',
      horaCreacion: '',
      fechaConforme: '',
      firmado: {
        tipo: '',
        auditor: '',
        motivo: '',
      }
    },
  ]);
  const [expanded, setExpanded] = useState('collapseOne');
  const [view, setView] = useState('welcome');
  const { currentUser } = useAuth();
  const [fechaConforme, setFechaConforme] = useState('');
  const [confirmacionVisible, setConfirmacionVisible] = useState(false);
  const [errorMensaje, setErrorMensaje] = useState('');
  const [contentLoaded, setContentLoaded] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [formRendered, setFormRendered] = useState(false);
  const [horasObtenidas, setHorasObtenidas] = useState(false);
  const [horaComienzoError, setHoraComienzoError] = useState('');
  const [horaFinalizacionError, setHoraFinalizacionError] = useState('');

  const mostrarError = (mensaje, duracion = 2000) => {
    setErrorMensaje(mensaje);
    setTimeout(() => {
      setErrorMensaje('');
    }, duracion);
  };

  const handleFechaConformeChange = (event) => {
    setFechaConforme(event.target.value);
  };

  const handleEliminarConforme = async (nroConforme) => {
    try {
      const db = getFirestore();
      const conformesDocRef = doc(collection(db, 'horas'), nroConforme);
      await deleteDoc(conformesDocRef);
      setHistorialHoras((prevHistorialHoras) => prevHistorialHoras.filter((hora) => hora.nroConforme !== nroConforme));
    } catch (error) {
      mostrarError('Error eliminando conformes', error);
    }
  };

  useEffect(() => {
    if (!currentUser) {
      return;
    }

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
        setContentLoaded(true);
      } catch (error) {
        mostrarError('Error obteniendo datos iniciales:', error);
        setLoading(false);
      }
    };
    obtenerDatosIniciales();
  }, [currentUser, formRendered]);

  const handleHoraComienzoChange = (event) => {
    const nuevaHoraComienzo = event.target.value;
    setHoraComienzo(nuevaHoraComienzo);
    setHoraComienzoError('');  // Limpiar el error al cambiar la hora
    validarHoras(nuevaHoraComienzo, horaFinalizacion);
    calcularCantidadHoras(nuevaHoraComienzo, horaFinalizacion);
  };

  const handleHoraFinalizacionChange = (event) => {
    const nuevaHoraFinalizacion = event.target.value;
    setHoraFinalizacion(nuevaHoraFinalizacion);
    setHoraFinalizacionError('');  // Limpiar el error al cambiar la hora
    validarHoras(horaComienzo, nuevaHoraFinalizacion);
    calcularCantidadHoras(horaComienzo, nuevaHoraFinalizacion);
  };

  const validarHoras = (horaInicio, horaFin) => {
    if (horaInicio && horaFin) {
      const horaInicioArray = horaInicio.split(':');
      const horaFinArray = horaFin.split(':');

      const inicio = new Date(0, 0, 0, horaInicioArray[0], horaInicioArray[1]);
      const fin = new Date(0, 0, 0, horaFinArray[0], horaFinArray[1]);

      if (inicio >= fin) {
        return "La hora de comienzo debe ser anterior a la hora de finalización.";
      } else if (fin < inicio) {
        return "La hora de finalización debe ser posterior a la hora de comienzo.";
      } else {
        return null; // Sin error
      }
    }
  };

  const calcularCantidadHoras = (horaInicio, horaFin) => {
    if (!horaInicio || !horaFin) {
      setCantidadHoras('--:--');
      setHorasObtenidas(false);
      return;
    }

    const horaInicioArray = horaInicio.split(':');
    const horaFinArray = horaFin.split(':');

    const inicio = new Date(0, 0, 0, horaInicioArray[0], horaInicioArray[1]);
    const fin = new Date(0, 0, 0, horaFinArray[0], horaFinArray[1]);

    const diferenciaEnMilisegundos = fin.getTime() - inicio.getTime();
    const horasTrabajadas = diferenciaEnMilisegundos / (1000 * 60 * 60);

    const horaInicioLaboral = new Date(0, 0, 0, 9, 0); // 09:00
    const horaFinLaboral = new Date(0, 0, 0, 18, 0);   // 18:00
    const esHorarioLaboral = (inicio >= horaInicioLaboral && fin <= horaFinLaboral);

    const factorMultiplicador = esHorarioLaboral ? 1 : 2;

    const horasTotales = horasTrabajadas * factorMultiplicador;
    const tipoTareaAutomatico = esHorarioLaboral ? 'Ordinaria' : 'Extraordinaria';

    const formato24Horas = (hours) => {
      const roundedHours = Math.floor(hours);
      const minutes = (hours - roundedHours) * 60;
      return `${roundedHours.toString().padStart(2, '0')}:${Math.round(minutes).toString().padStart(2, '0')}`;
    };

    if (inicio >= fin) {
      const popover = (
        <Popover id={`popover-error-hora-${nroConforme}`} className='p-2 bg-danger text-light' title="Error">
          <div className='text-center'>
            <div>La hora de comienzo debe ser anterior a la hora de finalización.</div>
          </div>
        </Popover>
      );

      setCantidadHoras(
        <OverlayTrigger trigger={['hover', 'focus']} placement="top" overlay={popover}>
          <span className='text-danger'>Error <FontAwesomeIcon icon={faInfoCircle} /></span>
        </OverlayTrigger>
      );
      setHorasObtenidas(true);
    } else {
      setCantidadHoras(formato24Horas(horasTotales));
      setHorasObtenidas(true);
      setTipoTarea('');
    }
  };

  const calcularTipoTarea = (horaInicio, horaFin) => {
    if (!horaInicio || !horaFin) {
      return '';
    }

    const horaInicioArray = horaInicio.split(':');
    const horaFinArray = horaFin.split(':');

    const inicio = new Date(0, 0, 0, horaInicioArray[0], horaInicioArray[1]);
    const fin = new Date(0, 0, 0, horaFinArray[0], horaFinArray[1]);

    const horaLaboralInicio = new Date(0, 0, 0, 9, 0); // Hora de inicio del horario laboral
    const horaLaboralFin = new Date(0, 0, 0, 18, 0); // Hora de fin del horario laboral

    if (inicio >= horaLaboralInicio && fin <= horaLaboralFin) {
      return 'Ordinaria';
    } else if ((inicio < horaLaboralInicio && fin <= horaLaboralInicio) || (inicio >= horaLaboralFin && fin > horaLaboralFin)) {
      return 'Extraordinaria';
    } else {
      const popover = (
        <Popover id={`popover-error-hora-fin-${nroConforme}`} className='p-2 bg-danger text-light' title="Error">
          <div className='text-center'>
            <div>Las horas ordinarias y extraordinarias deben estar en conformes diferentes.</div>
          </div>
        </Popover>
      );
      return (
        <OverlayTrigger trigger={['hover', 'focus']} placement="top" overlay={popover}>
          <span className='text-danger'>Error <FontAwesomeIcon icon={faInfoCircle} /></span>
        </OverlayTrigger>
      );
    }
  };

  const tipoTareaCalculado = calcularTipoTarea(horaComienzo, horaFinalizacion);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!horaComienzo || !horaFinalizacion || !detalleTareas || !fechaConforme) {
      mostrarError('Por favor, completa todos los campos obligatorios.');
      setTimeout(() => {
        setErrorMensaje('');
      }, 2000);
      return;
    }
    setGuardando(true);
    const db = getFirestore();
    const fechaCreacion = new Date().toLocaleDateString();
    const horaCreacion = new Date().toLocaleTimeString();
    const horaDocRef = doc(db, 'horas', nroConforme);
    try {
      await setDoc(horaDocRef, {
        nroConforme,
        tecnico,
        horaComienzo,
        horaFinalizacion,
        cantidadHoras,
        tipoTarea: tipoTareaCalculado,
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
    }
    catch (error) {
      mostrarError('Error guardando horas:', error);
    } finally {
      setGuardando(false);
    }
  };

  const limpiarFormulario = () => {
    setHoraComienzo('');
    setHoraFinalizacion('');
    setTipoTarea('');
    setDetalleTareas('');
    setCantidadHoras('');
    setHorasObtenidas(false);
  };

  const cambiarVista = async (opcion) => {
    setView(opcion);

    if (opcion === 'form') {
      setFormRendered(!formRendered);
    }

    if (opcion === 'history') {
      try {
        const db = getFirestore();
        const horasCollectionRef = collection(db, 'horas');
        const historialQuery = await getDocs(query(horasCollectionRef, orderBy('fechaCreacion', 'desc')));
        const historialData = historialQuery.docs.map((doc) => doc.data());
        setHistorialHoras(historialData);
      } catch (error) {
        mostrarError('Error obteniendo historial:', error);
      }
    }
  };

  const renderFirmado = (hora) => {
    if (hora.firmado && hora.firmado.tipo) {
      if (hora.firmado.tipo === 'conformidad') {
        return '👍 Conforme';
      } else if (hora.firmado.tipo === 'disconformidad') {
        return '👎 Disconforme';
      }
    }
    return '❌ No';
  };

  const renderFormulario = () => (
    <div className="vistaFormulario container m-5">
      <div className="horizontalDiv row">
        <div className="tagname col">
          <label className="label">Nro. Conforme</label>
        </div>
        <div className="contenido col">
          {`${String(nroConforme).slice(0, 3)}.${String(nroConforme).slice(3)}`}
        </div>
      </div>
      <div className="horizontalDiv row  mt-3">
        <div className="tagname col">
          <label className="label">Técnico</label>
        </div>
        <div className="contenido col">
          <label className="label">{tecnico}</label>
        </div>
      </div>
      <div className="horizontalDiv row  mt-3">
        <div className="tagname col">
          <label className="label">Fecha Conforme</label>
        </div>
        <div className="contenido col">
          <input type="date" value={fechaConforme} onChange={handleFechaConformeChange} required />
        </div>
      </div>
      <div className="horizontalDiv row">
        <div className="tagname col">
          <label className="label">Hora Comienzo</label>
        </div>
        <div className="contenido col">
          <input type="time" value={horaComienzo} onChange={handleHoraComienzoChange} required />
        </div>
      </div>
      <div className="horizontalDiv row">
        <div className="tagname col">
          <label className="label">Hora Finalización</label>
        </div>
        <div className="contenido col">
          <input type="time" value={horaFinalizacion} onChange={handleHoraFinalizacionChange} required />
        </div>
      </div>
      <div className="horizontalDiv row">
        <div className="tagname col">
          <label className="label">Cantidad de Horas</label>
        </div>
        <div className="contenido col">
          {horasObtenidas ? <label className="horasObtenidas">{cantidadHoras}</label> : <label className="horasObtenidas">--:--</label>}
        </div>
      </div>
      <div className="horizontalDiv row  mt-3">
        <div className="tagname col">
          <label className="label">Tipo de Tarea</label>
        </div>
        <div className="contenido col">
          <label className='tipoTarea'>{calcularTipoTarea(horaComienzo, horaFinalizacion)}</label>
        </div>
      </div>
      <div className="horizontalDiv row mt-3">
        <div className="tagname col">
          <label className="label">Detalle de Tareas</label>
        </div>
        <div className="contenido col">
          <textarea className='textarea-tecnico' value={detalleTareas} onChange={(e) => setDetalleTareas(e.target.value)} required />
        </div>
      </div>
    </div>
  );

  const renderHistorial = () => (
    <div className="historial-container">
      <h3>Historial de Horas</h3>
      {historialHoras.length === 0 ? (
        <p className="tabla-vacia">No hay conformes cargados.</p>
      ) : (
        <div className="historial-desktop">
          <Table striped bordered hover variant="dark" responsive>
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
                <th>Firmado</th>
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
                  <td className='tipoFirma'>
                    {hora.firmado && hora.firmado.motivo ? (
                      <span className="disconforme-indicator">
                        {renderFirmado(hora)}{' '}
                        <OverlayTrigger
                          trigger={['hover', 'focus']}
                          placement="top"
                          overlay={
                            <Popover id={`popover-${hora.nroConforme}`} className='p-2 bg-secondary text-light' title="Motivo de Disconformidad">
                              <div className='text-center'>
                                <div>Motivo</div>
                                <div>{hora.firmado.motivo}</div>
                              </div>
                            </Popover>
                          }
                        >
                          <FontAwesomeIcon icon={faInfoCircle} />
                        </OverlayTrigger>
                      </span>
                    ) : (
                      <span>
                        {renderFirmado(hora)}
                      </span>
                    )}
                  </td>
                  <td>
                    <button className='eliminar' onClick={() => handleEliminarConforme(hora.nroConforme)}>
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
      <div className="historial-mobile">
        <div className="accordion" id="historialAcordeon">
          {historialHoras.map((hora) => (
            <div className="accordion-item bg-dark text-light" key={hora.nroConforme}>
              <h2 className="accordion-header" id={`heading${hora.nroConforme}`}>
                <button className="accordion-button bg-dark text-white" type="button" data-bs-toggle="collapse" data-bs-target={`#collapse${hora.nroConforme}`} aria-expanded="false" aria-controls={`collapse${hora.nroConforme}`}>
                  {hora.nroConforme}
                </button>
              </h2>
              <div id={`collapse${hora.nroConforme}`} className="accordion-collapse collapse" aria-labelledby={`heading${hora.nroConforme}`} data-bs-parent="#historialAcordeon" >
                <div className="accordion-body">
                  <div className="accordion-body-content">
                    <p><strong>Técnico:</strong> {hora.tecnico}</p>
                    <p><strong>Hora Comienzo:</strong> {hora.horaComienzo}</p>
                    <p><strong>Hora Finalización:</strong> {hora.horaFinalizacion}</p>
                    <p><strong>Cantidad de Horas:</strong> {hora.cantidadHoras}</p>
                    <p><strong>Tipo de Tarea:</strong> {hora.tipoTarea}</p>
                    <p><strong>Detalle de Tareas:</strong> {hora.detalleTareas}</p>
                    <p><strong>Fecha de Creación:</strong> {hora.fechaCreacion}</p>
                    <p><strong>Hora de Creación:</strong> {hora.horaCreacion}</p>
                    <p><strong>Firmado:</strong> {renderFirmado(hora)}</p>
                    {hora.firmado && hora.firmado.tipo === 'disconformidad' && (
                      <p>
                        <strong>Motivo de Disconformidad:</strong> {hora.firmado.motivo}
                      </p>
                    )}
                  </div>
                  <button className='eliminar' onClick={() => handleEliminarConforme(hora.nroConforme)}>
                    <FontAwesomeIcon icon={faTrash} />
                    <span>Eliminar</span>
                  </button>
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
          <p>Cargando...</p>
          <Spinner />
        </div>
      ) : (
        <div className='tecnico-container bg-dark text-light'>
          <h2>Bienvenido, {tecnico.split(', ')[1]}</h2>
          <div className="botones">
            <button className='botones-vistas' onClick={() => cambiarVista('form')}>➕ Agregar horas</button>
            <button className='botones-vistas' onClick={() => cambiarVista('history')}>📝 Ver historial</button>
          </div>
          {view === 'form' && (
            <>
              {renderFormulario()}
              {errorMensaje && (
                <div className="mensaje-error bg-danger text-light rounded p-1 mb-5">
                  {errorMensaje}
                </div>
              )}
              {confirmacionVisible && (
                <div className="mensaje-confirmacion rounded p-1 m-3">
                  {`Conforme nro ${String(nroConforme - 1).padStart(6, '0').slice(0, 3)}.${String(nroConforme - 1).padStart(6, '0').slice(3)} cargado`}
                </div>
              )}
              <form id="form-tecnico" className='mb-5' onSubmit={handleSubmit} disabled={guardando}>
                <button type="submit">{guardando ? 'Guardando...' : 'Guardar'}</button>
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

  return <BarLoader className='rounded' color="white" loading css={override} />;
};

export default Tecnico;
