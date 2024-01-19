import React, { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, onSnapshot, getDoc, doc, writeBatch } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { css } from '@emotion/react';
import { BarLoader } from 'react-spinners';
import '../estilos/Auditor.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPen, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { OverlayTrigger, Popover } from 'react-bootstrap';

function Auditor() {
    const [loading, setLoading] = useState(true);
    const [horasTrabajo, setHorasTrabajo] = useState([]);
    const { currentUser } = useAuth();
    const [seleccionFirma, setSeleccionFirma] = useState({});
    const [seleccionConformidad, setSeleccionConformidad] = useState({});
    const [seleccionDisconformidad, setSeleccionDisconformidad] = useState({});
    const [firmandoConformidad, setFirmandoConformidad] = useState(false);
    const [firmandoDisconformidad, setFirmandoDisconformidad] = useState(false);
    const [motivoDisconformidadMobile, setMotivoDisconformidadMobile] = useState(false);
    const [showFirmarButton, setShowFirmarButton] = useState(false);
    const [expanded, setExpanded] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);
    const [motivoDisconformidad, setMotivoDisconformidad] = useState('');
    const [historialActualizado, setHistorialActualizado] = useState(0);
    const [firmando, setFirmando] = useState(false);
    const [registroExitoso, setRegistroExitoso] = useState(false);

    useEffect(() => {
        const obtenerHorasTrabajo = async () => {
            try {
                const db = getFirestore();
                const horasCollectionRef = collection(db, 'horas');
                const horasQuery = await getDocs(horasCollectionRef);
                const horasData = horasQuery.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
                setHorasTrabajo(horasData);
                setLoading(false);

                // Suscripción a cambios en tiempo real
                const unsubscribe = onSnapshot(horasCollectionRef, (snapshot) => {
                    const updatedHoras = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
                    setHorasTrabajo(updatedHoras);
                });

                // Devolver una función de limpieza
                return () => unsubscribe();
            } catch (error) {
                console.error('Error obteniendo horas de trabajo:', error);
                setLoading(false);
                setErrorMsg('Error obteniendo horas de trabajo. Por favor, intenta nuevamente.');
            }
        };

        obtenerHorasTrabajo();
    }, []);

    const handleCheckboxChange = (horaId, tipoFirma) => {
        setSeleccionFirma((prevSelected) => {
            const newSelection = { ...prevSelected };

            if (tipoFirma === 'conformidad') {
                newSelection[horaId] = newSelection[horaId] === 'conformidad' ? '' : 'conformidad';
            } else if (tipoFirma === 'disconformidad') {
                Object.keys(newSelection).forEach((key) => {
                    if (newSelection[key] === 'disconformidad' && key !== horaId) {
                        newSelection[key] = ''; // Desmarcar la disconformidad anterior
                    }
                });

                newSelection[horaId] = newSelection[horaId] === 'disconformidad' ? '' : 'disconformidad';
            }

            // Actualizar estados de conformidad y disconformidad
            setSeleccionConformidad((prev) => ({ ...prev, [horaId]: tipoFirma === 'conformidad' ? 'conformidad' : '' }));
            setSeleccionDisconformidad((prev) => ({ ...prev, [horaId]: tipoFirma === 'disconformidad' ? 'disconformidad' : '' }));

            // Actualizar el motivo de disconformidad
            const disconformidadSelected = Object.values(newSelection).some((tipo) => tipo === 'disconformidad');
            setMotivoDisconformidad(disconformidadSelected ? '' : motivoDisconformidad);

            // Mostrar el botón de firmar si hay al menos una conformidad o disconformidad seleccionada
            const haySeleccion = Object.values(newSelection).some((tipo) => tipo === 'conformidad' || tipo === 'disconformidad');
            setShowFirmarButton(haySeleccion);

            setErrorMsg('');

            return newSelection;
        });
    };


    const handleFirma = async () => {
        setFirmando(true);

        try {
            // Validar motivo de disconformidad
            if (Object.values(seleccionFirma).includes('disconformidad') && motivoDisconformidad.trim() === '') {
                setErrorMsg('El motivo de disconformidad es obligatorio.');
                setFirmando(false);
                return;
            }
            setErrorMsg('');
            const db = getFirestore();
            const batch = writeBatch(db);
            let nombreAuditor = '';
            let apellidoAuditor = '';
            let alMenosUnConformeFirmado = false;

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
                            nombreAuditor = userData.name;
                            apellidoAuditor = userData.surname;

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

                                if (tipoFirma === 'conformidad') {
                                    setSeleccionConformidad((prev) => ({ ...prev, [horaId]: 'conformidad' }));
                                    setSeleccionDisconformidad((prev) => ({ ...prev, [horaId]: '' }));
                                    alMenosUnConformeFirmado = true;
                                } else if (tipoFirma === 'disconformidad') {
                                    setSeleccionDisconformidad((prev) => ({ ...prev, [horaId]: 'disconformidad' }));
                                    setSeleccionConformidad((prev) => ({ ...prev, [horaId]: '' }));
                                }

                                // Call updateFirmaInfo with nombreAuditor and apellidoAuditor
                                updateFirmaInfo(horaId, nombreAuditor, apellidoAuditor);
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

            // Actualiza el estado de registroExitoso
            setRegistroExitoso(alMenosUnConformeFirmado);
            setTimeout(() => {
                // Restablece el estado después de un período de tiempo
                setRegistroExitoso(false);
            }, 5000);
            setSeleccionFirma({});
            setShowFirmarButton(false);
        } catch (error) {
            console.error('Error al firmar horas:', error);
        }
        setFirmando(false);
    };



    const updateFirmaInfo = (horaId, nombreAuditor, apellidoAuditor) => {
        setHorasTrabajo((prevHoras) => {
            const updatedHoras = [...prevHoras];
            const index = updatedHoras.findIndex((hora) => hora.id === horaId);

            if (index !== -1) {
                updatedHoras[index].firmado = {
                    tipo: 'conformidad',
                    auditor: `${nombreAuditor} ${apellidoAuditor}`,
                };
            }

            return updatedHoras;
        });
    };


    const Spinner = () => {
        const override = css`
      display: block;
      margin: 0 auto;
    `;
        return <BarLoader className='rounded' color="white" loading css={override} />;
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
            setFirmandoConformidad(true);
            const tipoFirma = 'conformidad';
            const db = getFirestore();
            const horaDocRef = doc(db, 'horas', horaId);
            const horaDoc = await getDoc(horaDocRef);
            let nombreAuditor = '';
            let apellidoAuditor = '';

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
                        nombreAuditor = userData.name;
                        apellidoAuditor = userData.surname;

                        const batch = writeBatch(db);

                        batch.update(horaDocRef, {
                            firmado: {
                                tipo: tipoFirma,
                                auditor: `${nombreAuditor} ${apellidoAuditor}`,
                            },
                        });

                        await batch.commit();
                        updateFirmaInfo(horaId);
                        setSeleccionConformidad((prev) => ({ ...prev, [horaId]: 'conformidad' }));
                        setSeleccionDisconformidad((prev) => ({ ...prev, [horaId]: '' }));
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
        setFirmandoConformidad(false);
    };


    const firmarDisconformeMobile = async (horaId) => {
        try {
            setFirmandoDisconformidad(true);
            const tipoFirma = 'disconformidad';
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
                        updateFirmaInfo();
                        setSeleccionDisconformidad((prev) => ({ ...prev, [horaId]: 'disconformidad' }));
                        setSeleccionConformidad((prev) => ({ ...prev, [horaId]: '' }));
                        setMotivoDisconformidad('');
                        setMotivoDisconformidadMobile(false);
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
        setFirmandoDisconformidad(false);
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
                                        <div className="contenedor-botones-firmar-mobile">
                                            <button className="boton-firmar-mobile" onClick={() => firmarConformeMobile(hora.id)}>
                                                {firmandoConformidad ? <FontAwesomeIcon icon={faSpinner} spin style={{ marginRight: '5px' }} className="fa-spin" /> : null}
                                                Conforme
                                            </button>
                                            <button className="boton-firmar-mobile" onClick={() => setMotivoDisconformidadMobile(true)}>
                                                Disconforme
                                            </button>
                                        </div>
                                        {motivoDisconformidadMobile ? (
                                            <div className="motivo-disconformidad-mobile">
                                                <textarea className='textarea-mobile' placeholder="Indique el motivo..." value={motivoDisconformidad} onChange={(e) => setMotivoDisconformidad(e.target.value)} required />
                                                <button className='boton-firmar-mobile' onClick={() => firmarDisconformeMobile(hora.id)}>
                                                    {firmandoDisconformidad ? <FontAwesomeIcon icon={faSpinner} spin style={{ marginRight: '5px' }} className="fa-spin" /> : null}
                                                    Firmar en Disconformidad
                                                </button>
                                            </div>
                                        ) : null}
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

    const renderPopover = (hora) => (
        <Popover id={`popover-${hora.id}`}>
            <Popover.Body>{hora.firmado.motivo}</Popover.Body>
        </Popover>
    );

    return (
        <div key={historialActualizado} className="auditor-container bg-dark text-light pb-5">
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
                                                    {hora.firmado && hora.firmado.tipo === 'disconformidad' ? (
                                                        <OverlayTrigger overlay={renderPopover(hora)}>
                                                            <span role="img" aria-label="Disconforme">❌</span>
                                                        </OverlayTrigger>
                                                    ) : (
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
                                    <textarea className='textarea-mobile' placeholder="Introduzca el motivo de su disconformidad..." value={motivoDisconformidad} onChange={(e) => setMotivoDisconformidad(e.target.value)} required />
                                </div>
                            )}
                            {errorMsg && <p className="bg-danger rounded text-center fs-6 p-1">{errorMsg}</p>}
                            {registroExitoso && <p className="bg-success rounded text-center fs-6 p-1">Firmas registradas exitosamente.</p>}
                            {showFirmarButton ? (
                                <button className="boton-firmar-desktop" type="button" onClick={handleFirma}>
                                    {firmando ?
                                        <FontAwesomeIcon icon={faSpinner} />
                                        : <FontAwesomeIcon icon={faUserPen} />}
                                    <span>Firmar</span>
                                </button>
                            ) : null}
                        </>
                    )}
                </div>
            )}
        </div >
    );
}

export default Auditor;
