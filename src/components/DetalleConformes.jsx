import React, { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, onSnapshot } from 'firebase/firestore';

function ConformeDetalles() {
    const [expanded, setExpanded] = useState(null);
    const [horasTrabajo, setHorasTrabajo] = useState([]);

    useEffect(() => {
        const obtenerHorasTrabajo = async () => {
            try {
                const db = getFirestore();
                const horasCollectionRef = collection(db, 'horas');
                const horasQuery = await getDocs(horasCollectionRef);
                const horasData = horasQuery.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
                setHorasTrabajo(horasData);
                // Suscripción a cambios en tiempo real
                const unsubscribe = onSnapshot(horasCollectionRef, (snapshot) => {
                    const updatedHoras = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
                    setHorasTrabajo(updatedHoras);
                });
                // Devolver una función de limpieza
                return () => unsubscribe();
            } catch (error) {
                console.error('Error obteniendo horas de trabajo:', error);
            }
        };

        obtenerHorasTrabajo();
    }, []);

    const renderHistorialMobile = () => (
        <div className="historial-mobile">
            <div className="accordion" id="historialAcordeon">
                {horasTrabajo.slice().reverse().map((hora) => (
                    <div className="accordion-item bg-dark text-light" key={hora.id}>
                        <h2 className="accordion-header" id={`heading${hora.id}`}>
                            <button className="accordion-button bg-dark text-light" type="button" data-bs-toggle="collapse" data-bs-target={`#collapse${hora.id}`} aria-expanded="false" aria-controls={`collapse${hora.id}`} onClick={() => toggleAcordeon(hora.id)}>
                                {hora.nroConforme}
                            </button>
                        </h2>
                        <div id={`collapse${hora.id}`} className={`accordion-collapse collapse ${expanded === hora.id ? 'show' : ''}`} aria-labelledby={`heading${hora.id}`} data-bs-parent="#historialAcordeon">
                            <div className="accordion-body">
                                <div className="accordion-body-content">
                                    <p><strong>Técnico:</strong> {hora.tecnico}</p>
                                    <p><strong>Hora Comienzo:</strong> {hora.horaComienzo} hs.</p>
                                    <p><strong>Hora Finalización:</strong> {hora.horaFinalizacion} hs.</p>
                                    <p><strong>Cantidad de Horas:</strong> {hora.cantidadHoras} hs.</p>
                                    <p><strong>Tipo de Tarea:</strong> {hora.tipoTarea}</p>
                                    <p><strong>Detalle de Tareas:</strong> {hora.detalleTareas}</p>
                                    <p><strong>Fecha de Creación:</strong> {hora.fechaCreacion}</p>
                                    <p><strong>Hora de Creación:</strong> {hora.horaCreacion}</p>
                                    <p><strong>Firmado:</strong> {renderFirmado(hora)}</p>
                                    {renderMotivoDisconformidad(hora)}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderHistorialDesktop = () => (
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
                </tr>
            </thead>
            <tbody>
                {horasTrabajo.map((hora) => (
                    <tr key={hora.id}>
                        <td>{hora.nroConforme}</td>
                        <td>{hora.tecnico}</td>
                        <td>{hora.horaComienzo}</td>
                        <td>{hora.horaFinalizacion}</td>
                        <td>{hora.cantidadHoras}</td>
                        <td>{hora.tipoTarea}</td>
                        <td>{hora.detalleTareas}</td>
                        <td>{hora.fechaCreacion}</td>
                        <td>{hora.horaCreacion}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );

    const renderPopover = (hora) => (
        <Popover id={`popover-${hora.id}`}>
            <Popover.Body>{hora.firmado.motivo}</Popover.Body>
        </Popover>
    );

    const renderFirmado = (hora) => {
        if (hora.firmado) {
            return hora.firmado.tipo === 'conformidad' ? '👍 Conforme' : '👎 Disconforme';
        } else {
            return '❌ No';
        }
    };

    const renderMotivoDisconformidad = (hora) => {
        if (hora.firmado && hora.firmado.tipo === 'disconformidad') {
            return (
                <p><strong>Motivo de Disconformidad:</strong> {hora.firmado.motivo}</p>
            );
        }
        return null;
    };

    const toggleAcordeon = (horaId) => {
        setExpanded((prevExpanded) => (prevExpanded === horaId ? null : horaId));
    };

    return (
        <div className="historial-container">
            <h3>Historial de Horas</h3>
            {window.innerWidth < 768 ? renderHistorialMobile() : renderHistorialDesktop()}
        </div>
    );
}

export default ConformeDetalles;
