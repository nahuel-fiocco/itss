import React, { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, updateDoc, getDoc, doc, writeBatch } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { css } from '@emotion/react';
import { BarLoader } from 'react-spinners';
import '../estilos/Auditor.css';

function Auditor() {
    const [loading, setLoading] = useState(true);
    const [horasTrabajo, setHorasTrabajo] = useState([]);
    const { currentUser } = useAuth();
    const [seleccionFirma, setSeleccionFirma] = useState({});
    const [confirmacionVisible, setConfirmacionVisible] = useState(false);
    const [expanded, setExpanded] = useState(null);

    const obtenerHorasTrabajo = async () => {
        try {
            const db = getFirestore();
            const horasCollectionRef = collection(db, 'horas');
            const horasQuery = await getDocs(horasCollectionRef);
            const horasData = horasQuery.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            setHorasTrabajo(horasData);
            setLoading(false);
        } catch (error) {
            console.error('Error obteniendo horas de trabajo:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        obtenerHorasTrabajo();
    }, []);

    const handleCheckboxChange = (horaId, tipoFirma) => {
        setSeleccionFirma((prevSelected) => {
            const newSelection = { ...prevSelected, [horaId]: tipoFirma };
            // Desmarcar la opción opuesta si se selecciona una nueva
            Object.keys(newSelection).forEach((id) => {
                if (id !== horaId && newSelection[id] === tipoFirma) {
                    newSelection[id] = undefined;
                }
            });
            return newSelection;
        });
    };

    const handleFirma = async () => {
        try {
            const db = getFirestore();
            const batch = writeBatch(db);

            const actualizarTabla = async (tipoFirma, seleccion) => {
                await Promise.all(Object.entries(seleccion).map(async ([horaId, selectedType]) => {
                    if (selectedType) {
                        const index = horasTrabajo.findIndex((hora) => hora.id === horaId);
                        if (index !== -1) {
                            const updatedHorasTrabajo = [...horasTrabajo];
                            updatedHorasTrabajo[index].firmado = { tipo: tipoFirma };
                            setHorasTrabajo(updatedHorasTrabajo);
                        }
                    }
                }));
            };

            await Promise.all(Object.entries(seleccionFirma).map(async ([horaId, tipoFirma]) => {
                if (tipoFirma) {
                    const horaDocRef = doc(db, 'horas', horaId);
                    const horaDoc = await getDoc(horaDocRef);

                    if (horaDoc.exists()) {
                        const horaData = horaDoc.data();

                        // Obtener el nombre y apellido del auditor desde la colección "users"
                        const userDocRef = doc(db, 'users', currentUser.uid);
                        const userDoc = await getDoc(userDocRef);

                        if (userDoc.exists()) {
                            const userData = userDoc.data();
                            const nombreAuditor = userData.name;
                            const apellidoAuditor = userData.surname;

                            if (horaData.firmado) {
                                console.error(`El documento con ID ${horaId} ya ha sido firmado.`);
                            } else {
                                batch.update(horaDocRef, {
                                    firmado: {
                                        tipo: tipoFirma,
                                        auditor: `${nombreAuditor} ${apellidoAuditor}`
                                    }
                                });
                                await actualizarTabla(tipoFirma, { [horaId]: true });
                            }
                        } else {
                            console.error(`No se encontró el documento del usuario con ID ${currentUser.uid}.`);
                        }
                    } else {
                        console.error(`El documento con ID ${horaId} no existe.`);
                    }
                }
            }));

            await batch.commit();
            setConfirmacionVisible(true);
            setSeleccionFirma({});

            setTimeout(() => {
                setConfirmacionVisible(false);
            }, 5000);
        } catch (error) {
            console.error('Error al firmar horas:', error);
        }
    };

    const Spinner = () => {
        const override = css`
      display: block;
      margin: 0 auto;
    `;

        return <BarLoader color="#36D7B7" loading css={override} />;
    };

    const renderHistorialMobile = () => (
        <div className="historial-mobile">
            <div className="accordion" id="historialAcordeon">
                {horasTrabajo.map((hora) => (
                    <div className="accordion-item bg-dark text-light" key={hora.id}>
                        <h2 className="accordion-header" id={`heading${hora.id}`}>
                            <button
                                className="accordion-button bg-dark text-light"
                                type="button"
                                data-bs-toggle="collapse"
                                data-bs-target={`#collapse${hora.id}`}
                                aria-expanded="false"
                                aria-controls={`collapse${hora.id}`}
                                onClick={() => toggleAcordeon(hora.id)}
                            >
                                {hora.nroConforme}
                            </button>
                        </h2>
                        <div
                            id={`collapse${hora.id}`}
                            className={`accordion-collapse collapse ${expanded === hora.id ? 'show' : ''}`}
                            aria-labelledby={`heading${hora.id}`}
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
                                <div className="conformidad">
                                    {hora.firmado && hora.firmado.tipo === 'conformidad' ? 'Conforme ✅' : (
                                        <input
                                            type="checkbox"
                                            checked={seleccionFirma[hora.id] === 'conformidad'}
                                            onChange={() => handleCheckboxChange(hora.id, 'conformidad')}
                                            disabled={hora.firmado !== undefined}
                                        />
                                    )}
                                </div>
                                <div className="disconformidad">
                                    {hora.firmado && hora.firmado.tipo === 'disconformidad' ? 'Disconforme ❌' : (
                                        <input
                                            type="checkbox"
                                            checked={seleccionFirma[hora.id] === 'disconformidad'}
                                            onChange={() => handleCheckboxChange(hora.id, 'disconformidad')}
                                            disabled={hora.firmado !== undefined}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const toggleAcordeon = (horaId) => {
        setExpanded((prevExpanded) => (prevExpanded === horaId ? null : horaId));
    };

    return (
        <div className="auditor-container bg-dark text-light">
            <h1>Auditor</h1>
            {loading ? (
                <Spinner />
            ) : (
                <div className="historial-container">
                    <h3>Historial de Horas</h3>
                    {window.innerWidth <= 768 ? renderHistorialMobile() : (
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
                                    <th>Conformidad</th>
                                    <th>Disconformidad</th>
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
                                        <td className="conformidad">
                                            {hora.firmado && hora.firmado.tipo === 'conformidad' ? '✅' : (
                                                <input
                                                    type="checkbox"
                                                    checked={seleccionFirma[hora.id] === 'conformidad'}
                                                    onChange={() => handleCheckboxChange(hora.id, 'conformidad')}
                                                    disabled={hora.firmado !== undefined}
                                                />
                                            )}
                                        </td>
                                        <td className="disconformidad">
                                            {hora.firmado && hora.firmado.tipo === 'disconformidad' ? '❌' : (
                                                <input
                                                    type="checkbox"
                                                    checked={seleccionFirma[hora.id] === 'disconformidad'}
                                                    onChange={() => handleCheckboxChange(hora.id, 'disconformidad')}
                                                    disabled={hora.firmado !== undefined}
                                                />
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                    <div className="botones-firmar">
                        <button className='boton-firmar' type="button" onClick={handleFirma} disabled={!Object.keys(seleccionFirma).length}>
                            Firmar
                        </button>
                    </div>
                    {confirmacionVisible && <p>Firmas registradas exitosamente.</p>}
                </div>
            )}
        </div>
    );
}

export default Auditor;
