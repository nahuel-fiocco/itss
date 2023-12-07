import React, { useState, useEffect } from 'react';
import { getFirestore, collection, doc, getDoc, addDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import '../estilos/Tecnico.css';

function Tecnico() {
  const [nroConforme, setNroConforme] = useState(null);
  const [tecnico, setTecnico] = useState('');
  const [horaComienzo, setHoraComienzo] = useState('');
  const [horaFinalizacion, setHoraFinalizacion] = useState('');
  const [tipoTarea, setTipoTarea] = useState('');
  const [detalleTareas, setDetalleTareas] = useState('');
  const [cantidadHoras, setCantidadHoras] = useState('');
  const [expanded, setExpanded] = useState('collapseOne');
  const { currentUser } = useAuth();

  useEffect(() => {
    const obtenerNombreTecnico = async () => {
      const db = getFirestore();

      if (currentUser) {
        const userDoc = doc(collection(db, 'users'), currentUser.uid);
        const userSnapshot = await getDoc(userDoc);

        if (userSnapshot.exists()) {
          const userData = userSnapshot.data();
          const nombreTecnico = `${userData.name}`;
          const apellidoTecnico = `${userData.surname}`;
          const Tecnico = `${apellidoTecnico}, ${nombreTecnico}`;
          setTecnico(Tecnico);
        }
      }
    };

    const obtenerUltimoNroConforme = async () => {
      const db = getFirestore();
      const horasDoc = doc(collection(db, 'horas'), '000000');
      const horasSnapshot = await getDoc(horasDoc);

      if (horasSnapshot.exists()) {
        const ultimoNroConforme = horasSnapshot.data().ultimoNroConforme;
        setNroConforme(ultimoNroConforme + 1);
      }
    };

    obtenerNombreTecnico();
    obtenerUltimoNroConforme();
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

    const diferencia = fin.getTime() - inicio.getTime();
    const horas = Math.floor(diferencia / (1000 * 60 * 60));

    setCantidadHoras(horas);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const db = getFirestore();

    await addDoc(collection(db, 'horas'), {
      nroConforme,
      tecnico,
      horaComienzo,
      horaFinalizacion,
      cantidadHoras,
      tipoTarea,
      detalleTareas,
    });

    setNroConforme(null);
    setHoraComienzo('');
    setHoraFinalizacion('');
    setTipoTarea('');
    setDetalleTareas('');
    setCantidadHoras('');
  };

  return (
    <div className='tecnico-container'>
      <h2>Bienvenido, {tecnico.split(', ')[1]}</h2>
      <div className="campos">
        <label>{nroConforme}</label>
        <label>{tecnico}</label>
        <input type="time" value={horaComienzo} onChange={handleHoraComienzoChange} required />
        <input type="time" value={horaFinalizacion} onChange={handleHoraFinalizacionChange} required />
        <label>{cantidadHoras}</label>
        <select value={tipoTarea} onChange={(e) => setTipoTarea(e.target.value)} required>
          <option value="">Selecciona...</option>
          <option value="correctivo">Correctivo</option>
          <option value="preventivo">Preventivo</option>
          <option value="ambas">Ambas</option>
        </select>
        <textarea value={detalleTareas} onChange={(e) => setDetalleTareas(e.target.value)} required />
      </div>
      <form onSubmit={handleSubmit}>
        <button type="submit">Guardar Horas</button>
      </form>
    </div >
  );
}

export default Tecnico;
