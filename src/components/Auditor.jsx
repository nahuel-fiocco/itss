import React, { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, updateDoc, getDoc, doc, writeBatch } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { css } from '@emotion/react';
import { BarLoader } from 'react-spinners';
import '../estilos/Auditor.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPen } from '@fortawesome/free-solid-svg-icons';

function Auditor() {
    const [loading, setLoading] = useState(true);
    const [horasTrabajo, setHorasTrabajo] = useState([]);
    const { currentUser } = useAuth();
    const [seleccionFirma, setSeleccionFirma] = useState({});
    const [confirmacionVisible, setConfirmacionVisible] = useState(false);
    const [expanded, setExpanded] = useState(null);
    const [motivoDisconformidad, setMotivoDisconformidad] = useState('');
    const [errorMsg, setErrorMsg] = useState(null);
    const [seleccionConformidad, setSeleccionConformidad] = useState({});
    const [seleccionDisconformidad, setSeleccionDisconformidad] = useState({});

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
            setErrorMsg('');

            if (tipoFirma === 'conformidad') {
                setSeleccionConformidad((prev) => ({
                    ...prev,
                    [horaId]: prev[horaId] === 'conformidad' ? '' : 'conformidad',
                }));
            } else if (tipoFirma === 'disconformidad') {
                setSeleccionDisconformidad((prev) => ({
                    ...prev,
                    [horaId]: prev[horaId] === 'disconformidad' ? '' : 'disconformidad',
                }));
            }

            Object.keys(newSelection).forEach((id) => {
                if (id !== horaId && newSelection[id] === tipoFirma) {
                    delete newSelection[id];
                }
            });

            const disconformidadSelected = Object.values(newSelection).some((tipo) => tipo === 'disconformidad');
            setMotivoDisconformidad(disconformidadSelected ? '' : motivoDisconformidad);

            return newSelection;
        });
    };

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

    const handleFirma = async () => {
        try {
            const db = getFirestore();
            const batch = writeBatch(db);

            await Promise.all(Object.entries(seleccionFirma).map(async ([horaId, tipoFirma]) => {
                if (tipoFirma) {
                    const horaDocRef = doc(db, 'horas', horaId);
                    const horaDoc = await getDoc(horaDocRef);

                    if (horaDoc.exists()) {
                        const horaData = horaDoc.data();

                        const userDocRef = currentUser ? doc(db, 'users', currentUser.uid) : null;
                        let userDoc;

                        if (userDocRef) {
                            userDoc = await getDoc(userDocRef);
                        }

                        if (userDoc && userDoc.exists()) {
                            const userData = userDoc.data();
                            const nombreAuditor = userData.name;
                            const apellidoAuditor = userData.surname;

                            if (horaData.firmado) {
                                console.error(`El documento con ID ${horaId} ya ha sido firmado.`);
                            } else {
                                batch.update(horaDocRef, {
                                    firmado: {
                                        tipo: tipoFirma,
                                        auditor: `${nombreAuditor} ${apellidoAuditor}`,
                                        motivo: tipoFirma === 'disconformidad' ? motivoDisconformidad : null,
                                    },
                                });
                                await actualizarTabla(tipoFirma, { [horaId]: true });

                                if (tipoFirma === 'conformidad') {
                                    setSeleccionConformidad((prev) => ({
                                        ...prev,
                                        [horaId]: 'conformidad',
                                    }));
                                    setSeleccionDisconformidad((prev) => ({
                                        ...prev,
                                        [horaId]: '',
                                    }));
                                } else if (tipoFirma === 'disconformidad') {
                                    setSeleccionDisconformidad((prev) => ({
                                        ...prev,
                                        [horaId]: 'disconformidad',
                                    }));
                                    setSeleccionConformidad((prev) => ({
                                        ...prev,
                                        [horaId]: '',
                                    }));
                                }
                            }
                        } else {
                            console.error(`No se encontró el documento del usuario.`);
                        }
                    } else {
                        console.error(`El documento con ID ${horaId} no existe.`);
                    }
                }
            }));

            await batch.commit();

            // Actualizar la información de firma específicamente
            updateFirmaInfo();

            setConfirmacionVisible(true);
            setSeleccionFirma({});

            setTimeout(() => {
                setConfirmacionVisible(false);
            }, 5000);
        } catch (error) {
            console.error('Error al firmar horas:', error);
        }
    };

    // Nueva función para actualizar la información de firma
    const updateFirmaInfo = () => {
        setHorasTrabajo((prevHoras) => {
            const updatedHoras = [...prevHoras];

            // Actualizar solo la información de firma
            Object.entries(seleccionFirma).forEach(([horaId, tipoFirma]) => {
                const index = updatedHoras.findIndex((hora) => hora.id === horaId);
                if (index !== -1) {
                    updatedHoras[index].firmado = {
                        tipo: tipoFirma,
                        motivo: tipoFirma === 'disconformidad' ? motivoDisconformidad : null,
                    };
                }
            });

            return updatedHoras;
        });
    };



    const Spinner = () => {
        const override = css`
      display: block;
      margin: 0 auto;
    `;

        return <BarLoader className='rounded' color="#36D7B7" loading css={override} />;
    };

    const renderFirmado = (hora) => {
        if (hora.firmado) {
            return hora.firmado.tipo === 'conformidad' ? '👍 Conforme' : '👎 Disconforme';
        }
        else {
            return '❌ No';
        }
    };

    const firmarConformeMobile = async (horaId) => {
        try {
            const tipoFirma = 'conformidad';

            const db = getFirestore();
            const horaDocRef = doc(db, 'horas', horaId);
            const horaDoc = await getDoc(horaDocRef);

            if (horaDoc.exists()) {
                const horaData = horaDoc.data();

                if (horaData.firmado) {
                    console.error(`El documento con ID ${horaId} ya ha sido firmado.`);
                } else {
                    const userDocRef = currentUser ? doc(db, 'users', currentUser.uid) : null;
                    let userDoc;

                    if (userDocRef) {
                        userDoc = await getDoc(userDocRef);
                    }

                    if (userDoc && userDoc.exists()) {
                        const userData = userDoc.data();
                        const nombreAuditor = userData.name;
                        const apellidoAuditor = userData.surname;

                        const batch = writeBatch(db);

                        batch.update(horaDocRef, {
                            firmado: {
                                tipo: tipoFirma,
                                auditor: `${nombreAuditor} ${apellidoAuditor}`,
                            },
                        });

                        await batch.commit();

                        setConfirmacionVisible(true);
                        setSeleccionConformidad((prev) => ({ ...prev, [horaId]: 'conformidad' }));
                        setSeleccionDisconformidad((prev) => ({ ...prev, [horaId]: '' }));
                        renderHistorialMobile();

                        setTimeout(() => {
                            setConfirmacionVisible(false);
                        }, 5000);
                    } else {
                        console.error(`No se encontró el documento del usuario.`);
                    }
                }
            } else {
                console.error(`El documento con ID ${horaId} no existe.`);
            }
        } catch (error) {
            console.error('Error al firmar en conformidad:', error);
        }
    };

    const firmarDisconformeMobile = async (horaId) => {
        try {
            const tipoFirma = 'disconformidad';

            // Verificar que el motivo de disconformidad esté completo
            if (!motivoDisconformidad) {
                setErrorMsg('El motivo de disconformidad es obligatorio.');
                return;
            }

            const db = getFirestore();
            const horaDocRef = doc(db, 'horas', horaId);
            const horaDoc = await getDoc(horaDocRef);

            if (horaDoc.exists()) {
                const horaData = horaDoc.data();

                if (horaData.firmado) {
                    console.error(`El documento con ID ${horaId} ya ha sido firmado.`);
                } else {
                    const userDocRef = currentUser ? doc(db, 'users', currentUser.uid) : null;
                    let userDoc;

                    if (userDocRef) {
                        userDoc = await getDoc(userDocRef);
                    }

                    if (userDoc && userDoc.exists()) {
                        const userData = userDoc.data();
                        const nombreAuditor = userData.name;
                        const apellidoAuditor = userData.surname;

                        const batch = writeBatch(db);

                        batch.update(horaDocRef, {
                            firmado: {
                                tipo: tipoFirma,
                                auditor: `${nombreAuditor} ${apellidoAuditor}`,
                                motivo: motivoDisconformidad,
                            },
                        });

                        await batch.commit();

                        setConfirmacionVisible(true);
                        setSeleccionDisconformidad((prev) => ({ ...prev, [horaId]: 'disconformidad' }));
                        setSeleccionConformidad((prev) => ({ ...prev, [horaId]: '' }));
                        renderHistorialMobile();

                        setTimeout(() => {
                            setConfirmacionVisible(false);
                        }, 5000);
                    } else {
                        console.error(`No se encontró el documento del usuario.`);
                    }
                }
            } else {
                console.error(`El documento con ID ${horaId} no existe.`);
            }
        } catch (error) {
            console.error('Error al firmar en disconformidad:', error);
        }
    };

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
                                {hora.firmado ? null : (
                                    <div className='contenedor-firmar-mobile'>
                                        <button className="boton-firmar-mobile" onClick={() => firmarConformeMobile(hora.id)}>
                                            <span>Conforme</span>
                                        </button>
                                        <button className="boton-firmar-mobile" onClick={() => firmarDisconformeMobile(hora.id)}>
                                            <span>Disconforme</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

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
        <div className="auditor-container bg-dark text-light pb-5">
            {loading ? (
                <div className="spinner-container bg-dark text-light">
                    <p>Cargando...</p>
                    <Spinner />
                </div>
            ) : (
                <div className="historial-container">
                    <h3>Historial de Horas</h3>
                    {horasTrabajo.length === 0 ? (<p className='tabla-vacia'>No hay ningun conforme cargado.</p>) : (
                        <>
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
                                                        <input type="checkbox" checked={seleccionFirma[hora.id] === 'conformidad'} onChange={() => handleCheckboxChange(hora.id, 'conformidad')}
                                                            disabled={hora.firmado !== undefined} />
                                                    )}
                                                </td>
                                                <td className="disconformidad">
                                                    {hora.firmado && hora.firmado.tipo === 'disconformidad' ? '❌' : (
                                                        <input type="checkbox" checked={seleccionFirma[hora.id] === 'disconformidad'} onChange={() => handleCheckboxChange(hora.id, 'disconformidad')} disabled={hora.firmado !== undefined} />
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                            {Object.values(seleccionFirma).some((tipo) => tipo === 'disconformidad') && (
                                <div className="motivo-disconformidad">
                                    <textarea placeholder="Introduzca el motivo de su disconformidad..." value={motivoDisconformidad} onChange={(e) => setMotivoDisconformidad(e.target.value)} required />
                                </div>
                            )}
                            {confirmacionVisible && <p>Firmas registradas exitosamente.</p>}
                            {errorMsg && <p className="bg-danger rounded p-1">{errorMsg}</p>}
                            <button className="boton-firmar-desktop" type="button" onClick={handleFirma} disabled={Object.keys(seleccionFirma).length === 0}>
                                <FontAwesomeIcon icon={faUserPen} />
                                <span>Firmar</span>
                            </button>
                        </>
                    )}
                </div>
            )}
        </div >
    );
}

export default Auditor;
