import React, { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, onSnapshot, doc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import '../estilos/DetalleFichas.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faTrash, faInfoCircle, faHouse, faFilePdf, faFileExcel } from '@fortawesome/free-solid-svg-icons';
import { Dropdown, DropdownButton, OverlayTrigger, Popover, Table } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import jsPDF from 'jspdf';
import ExcelJS from 'exceljs';

const DetalleFichas = ({ onRegresar }) => {
    const [expanded, setExpanded] = useState(null);
    const [horasTrabajo, setHorasTrabajo] = useState([]);
    const [modoEdicion, setModoEdicion] = useState(false);
    const [horaEditando, setHoraEditando] = useState(null);
    const [tecnico, setTecnico] = useState('');
    const { currentUser } = useAuth();
    const [fechaFicha, setFechaFicha] = useState('');
    const [horaComienzo, setHoraComienzo] = useState('');
    const [horaFinalizacion, setHoraFinalizacion] = useState('');
    const [cantidadHoras, setCantidadHoras] = useState(null);
    const [detalleTareas, setDetalleTareas] = useState('');
    const [obteniendoDatos, setObteniendoDatos] = useState(true);

    useEffect(() => {
        const obtenerHorasTrabajo = async () => {
            setObteniendoDatos(true);
            try {
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
                const horasCollectionRef = collection(db, 'horas');
                const horasQuery = await getDocs(horasCollectionRef);
                const horasData = horasQuery.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
                setHorasTrabajo(horasData);
                setObteniendoDatos(false);
                const unsubscribe = onSnapshot(horasCollectionRef, (snapshot) => {
                    const updatedHoras = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
                    setHorasTrabajo(updatedHoras);
                });
                if (horaEditando) {
                    setFechaFicha(horaEditando.fechaFicha);
                    setHoraComienzo(horaEditando.horaComienzo);
                    setHoraFinalizacion(horaEditando.horaFinalizacion);
                    setCantidadHoras(horaEditando.cantidadHoras);
                    setDetalleTareas(horaEditando.detalleTareas);
                }
                return () => unsubscribe();
            } catch (error) {
                console.error('Error obteniendo horas de trabajo:', error);
            }
        };
        obtenerHorasTrabajo();
    }, [currentUser, horaEditando]);

    const renderFormularioEdicion = () => (
        <div className="vistaFormulario container m-5">
            <div className="horizontalDiv row">
                <div className="tagname col">
                    <label className="label">Nro. Ficha</label>
                </div>
                <div className="contenido col">
                    {horaEditando && `${String(horaEditando.id).slice(0, 3)}.${String(horaEditando.id).slice(3)}`}
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
                    <label className="label">Fecha Ficha</label>
                </div>
                <div className="contenido col">
                    <input type="date" value={fechaFicha} onChange={handleFechaFichaChange} required />
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

    const cancelarEdicion = () => {
        setHoraEditando(null);
        setModoEdicion(false);
    };

    const guardarCambios = async () => {
        try {
            const db = getFirestore();
            const fichassCollection = collection(db, 'horas');
            const fichasDoc = doc(fichassCollection, horaEditando.id);

            await updateDoc(fichasDoc, {
                fechaFicha,
                horaComienzo,
                horaFinalizacion,
                cantidadHoras,
                detalleTareas,
            });

            setModoEdicion(false);
            setHoraEditando(null);

            console.log('Ficha editada correctamente.');
        } catch (error) {
            console.error('Error al actualizar la ficha:', error);
        }
    };

    const iniciarEdicion = (hora) => {
        setModoEdicion(true);
        setHoraEditando(hora);
    };

    const eliminarficha = async (hora) => {
        try {
            if (hora) {
                const db = getFirestore();
                const fichasCollection = collection(db, 'horas');

                await deleteDoc(doc(fichasCollection, hora.id));
                setModoEdicion(false);
                setHoraEditando(null);
            } else {
                console.error('No se proporcionó información de la ficha para eliminar.');
            }
        } catch (error) {
            console.error('Error al eliminar el documento:', error);
        }
    };


    const handleFechaFichaChange = (e) => {
        setFechaFicha(e.target.value);
    };

    const handleHoraComienzoChange = (e) => {
        setHoraComienzo(e.target.value);
    };

    const handleHoraFinalizacionChange = (e) => {
        setHoraFinalizacion(e.target.value);
    };

    const horasObtenidas = () => {
        if (horaComienzo && horaFinalizacion) {
            const horaComienzoArray = horaComienzo.split(':');
            const horaFinalizacionArray = horaFinalizacion.split(':');
            const horaComienzoMinutos = horaComienzoArray[0] * 60 + horaComienzoArray[1] * 1;
            const horaFinalizacionMinutos = horaFinalizacionArray[0] * 60 + horaFinalizacionArray[1] * 1;
            const diferenciaMinutos = horaFinalizacionMinutos - horaComienzoMinutos;
            const diferenciaHoras = Math.floor(diferenciaMinutos / 60);
            const diferenciaMinutosRestantes = diferenciaMinutos % 60;
            const diferenciaHorasString = diferenciaHoras < 10 ? `0${diferenciaHoras}` : `${diferenciaHoras}`;
            const diferenciaMinutosString = diferenciaMinutosRestantes < 10 ? `0${diferenciaMinutosRestantes}` : `${diferenciaMinutosRestantes}`;
            const diferenciaString = `${diferenciaHorasString}:${diferenciaMinutosString}`;
            setCantidadHoras(diferenciaString);
            return true;
        }
        return false;
    };

    const calcularTipoTarea = (horaInicio, horaFin) => {
        if (!horaInicio || !horaFin) {
            return '';
        }

        const horaInicioArray = horaInicio.split(':');
        const horaFinArray = horaFin.split(':');

        const inicio = new Date(0, 0, 0, horaInicioArray[0], horaInicioArray[1]);
        const fin = new Date(0, 0, 0, horaFinArray[0], horaFinArray[1]);

        const horaLaboralInicio = new Date(0, 0, 0, 9, 0);
        const horaLaboralFin = new Date(0, 0, 0, 18, 0);

        if (inicio >= horaLaboralInicio && fin <= horaLaboralFin) {
            return 'Normal';
        } else if ((inicio < horaLaboralInicio && fin <= horaLaboralInicio) || (inicio >= horaLaboralFin && fin > horaLaboralFin)) {
            return 'Extra';
        } else {
            console.error('Las horas Normal y Extra deben estar en fichas diferentes.');
            return '';
        }
    };

    const renderHistorialMobile = () => {
        if (horasTrabajo.length === 0) {
            return <p>No hay fichas cargados</p>;
        }
        return (
            < div className="historial-mobile" >
                <div className="accordion" id="historialAcordeon">
                    {horasTrabajo.slice().reverse().map((hora) => (
                        <div className="accordion-item bg-dark text-light" key={hora.id}>
                            <h2 className="accordion-header" id={`heading${hora.id}`}>
                                <button className="accordion-button bg-dark text-light" type="button" data-bs-toggle="collapse" data-bs-target={`#collapse${hora.id}`} aria-expanded="false" aria-controls={`collapse${hora.id}`} onClick={() => toggleAcordeon(hora.id)}>
                                    {hora.NroFicha}
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
                                    <div className="contenedor-botones">
                                        <button type="button" onClick={() => iniciarEdicion(hora)}>
                                            <FontAwesomeIcon icon={faPen} />
                                            Editar
                                        </button>
                                        <button type="button" onClick={() => eliminarficha(hora)}>
                                            <FontAwesomeIcon icon={faTrash} />
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div >
        );
    };

    const renderHistorialDesktop = () => {
        if (horasTrabajo.length === 0) {
            return <p>No hay fichas cargados</p>;
        }
        return (
            <Table striped bordered hover variant="dark" responsive>
                <thead>
                    <tr>
                        <th>Nro. ficha</th>
                        <th>Técnico</th>
                        <th>Hora Comienzo</th>
                        <th>Hora Finalización</th>
                        <th>Cantidad de Horas</th>
                        <th>Tipo de Tarea</th>
                        <th>Detalle de Tareas</th>
                        <th>Fecha de Creación</th>
                        <th>Hora de Creación</th>
                        <th>Firmado</th>
                        <th>Editar</th>
                        <th>Eliminar</th>
                    </tr>
                </thead>
                <tbody>
                    {horasTrabajo.map((hora) => (
                        <tr key={hora.id}>
                            <td>{hora.NroFicha}</td>
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
                                    <span className="disficha-indicator">
                                        {renderFirmado(hora)}{' '}
                                        <OverlayTrigger
                                            trigger={['hover', 'focus']}
                                            placement="top"
                                            overlay={
                                                <Popover id={`popover-${hora.NroFicha}`} className='p-2 bg-secondary text-light' title="Motivo de Disconformidad">
                                                    <div className='text-center'>
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
                                <button type="button" onClick={() => iniciarEdicion(hora)}>
                                    <FontAwesomeIcon icon={faPen} />
                                </button>
                            </td>
                            <td>
                                <button type="button" onClick={() => eliminarficha(hora)}>
                                    <FontAwesomeIcon icon={faTrash} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        );
    };

    const renderFirmado = (hora) => {
        if (hora.firmado) {
            return hora.firmado.tipo === 'conformidad' ? '👍 ficha' : '👎 disconformidad';
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

    const generarReportePDF = () => {
        const pdfDoc = new jsPDF();

        const espacioEntreConformidades = pdfDoc.internal.pageSize.getHeight() / 2 - 10;

        horasTrabajo.forEach((hora, index) => {
            if (index % 2 === 0 && index > 0) {
                pdfDoc.addPage();
            }

            const conformidadEnPagina = index % 2 === 0 ? 1 : 2;

            const yPos = 25 + ((conformidadEnPagina - 1) * espacioEntreConformidades);

            const numeroficha = (index + 1).toString().padStart(6, '0');
            pdfDoc.text(`ficha nro: ${numeroficha}`, pdfDoc.internal.pageSize.getWidth() / 2, yPos, { align: 'center' });

            pdfDoc.text(`Fecha:`, 20, yPos + 10);
            pdfDoc.text(`Técnico:`, 20, yPos + 20);
            pdfDoc.text(`Hora Comienzo:`, 20, yPos + 30);
            pdfDoc.text(`Hora Finalización:`, 20, yPos + 40);
            pdfDoc.text(`Cantidad de Horas:`, 20, yPos + 50);
            pdfDoc.text(`Tipo de Tarea:`, 20, yPos + 60);
            pdfDoc.text(`Detalle de Tareas:`, 20, yPos + 70);
            pdfDoc.text(`Fecha de Creación:`, 20, yPos + 80);
            pdfDoc.text(`Hora de Creación:`, 20, yPos + 90);
            pdfDoc.text(`Firmado:`, 20, yPos + 100);

            pdfDoc.text(`${hora.fechaFicha}`, pdfDoc.internal.pageSize.getWidth() - 20, yPos + 10, { align: 'right' });
            pdfDoc.text(`${hora.tecnico}`, pdfDoc.internal.pageSize.getWidth() - 20, yPos + 20, { align: 'right' });
            pdfDoc.text(`${hora.horaComienzo} hs.`, pdfDoc.internal.pageSize.getWidth() - 20, yPos + 30, { align: 'right' });
            pdfDoc.text(`${hora.horaFinalizacion} hs.`, pdfDoc.internal.pageSize.getWidth() - 20, yPos + 40, { align: 'right' });
            pdfDoc.text(`${hora.cantidadHoras} hs.`, pdfDoc.internal.pageSize.getWidth() - 20, yPos + 50, { align: 'right' });

            const tipoTarea = hora.tipoTarea ? hora.tipoTarea : 'Normal';
            pdfDoc.text(`${tipoTarea}`, pdfDoc.internal.pageSize.getWidth() - 20, yPos + 60, { align: 'right' });

            pdfDoc.text(`${hora.detalleTareas}`, pdfDoc.internal.pageSize.getWidth() - 20, yPos + 70, { align: 'right' });
            pdfDoc.text(`${hora.fechaCreacion}`, pdfDoc.internal.pageSize.getWidth() - 20, yPos + 80, { align: 'right' });
            pdfDoc.text(`${hora.horaCreacion}`, pdfDoc.internal.pageSize.getWidth() - 20, yPos + 90, { align: 'right' });

            let textoFirma = '';
            if (renderFirmado(hora) === '👍 ficha') {
                textoFirma = 'ficha';
                pdfDoc.text(`${textoFirma}`, pdfDoc.internal.pageSize.getWidth() - 20, yPos + 100, { align: 'right' });
            } else if (renderFirmado(hora) === '👎 Disficha') {
                textoFirma = 'Disficha';
                pdfDoc.text(`${textoFirma}`, pdfDoc.internal.pageSize.getWidth() - 20, yPos + 100, { align: 'right' });
                pdfDoc.text(`Motivo:`, 20, yPos + 110);
                pdfDoc.text(`${hora.firmado.motivo}`, pdfDoc.internal.pageSize.getWidth() - 20, yPos + 110, { align: 'right' });
            } else {
                textoFirma = 'No';
                pdfDoc.text(`${textoFirma}`, pdfDoc.internal.pageSize.getWidth() - 20, yPos + 100, { align: 'right' });
            }
        });

        pdfDoc.save('historial_fichas.pdf');
    };

    const generarReporteExcel = async () => {
        try {
            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet('Historial fichas');

            sheet.columns = [
                { header: 'Nro. ficha', key: 'NroFicha' },
                { header: 'Técnico', key: 'tecnico' },
                { header: 'Fecha ficha', key: 'fechaFicha' },
                { header: 'Hora Comienzo', key: 'horaComienzo' },
                { header: 'Hora Finalización', key: 'horaFinalizacion' },
                { header: 'Cantidad de Horas', key: 'cantidadHoras' },
                { header: 'Tipo de Tarea', key: 'tipoTareaCalculado' },
                { header: 'Detalle de Tareas', key: 'detalleTareas' },
                { header: 'Fecha de Creación', key: 'fechaCreacion' },
                { header: 'Firmado', key: 'firmado' }
            ];

            horasTrabajo.forEach((hora) => {
                sheet.addRow({
                    NroFicha: hora.NroFicha,
                    tecnico: hora.tecnico,
                    fechaFicha: hora.fechaFicha,
                    horaComienzo: hora.horaComienzo,
                    horaFinalizacion: hora.horaFinalizacion,
                    cantidadHoras: hora.cantidadHoras,
                    tipoTareaCalculado: calcularTipoTarea(hora.horaComienzo, hora.horaFinalizacion),
                    detalleTareas: hora.detalleTareas,
                    fechaCreacion: hora.fechaCreacion,
                    firmado: renderFirmado(hora),
                });
            });

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = 'historial_fichas.xlsx';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            console.log('Reporte de Excel generado correctamente.');
        } catch (error) {
            console.error('Error al generar el reporte de Excel:', error);
        }
    };

    return (
        <div className="historial-container">
            {obteniendoDatos ? <p>Obteniendo datos...</p> :
                modoEdicion ? (
                    <div className='formularioEdicion'>
                        {renderFormularioEdicion()}
                        <div className="contenedorBotonesEdicion">
                            <button onClick={guardarCambios}>Guardar Cambios</button>
                            <button onClick={cancelarEdicion}>Cancelar</button>
                        </div>
                    </div>
                ) : (
                    <>
                        {window.innerWidth > 768 ? <h3>Historial de fichas</h3> : <h5>Detalle historico de fichas</h5>}
                        {window.innerWidth < 768 ? renderHistorialMobile() : renderHistorialDesktop()}
                    </>
                )}
            <div className="d-flex gap-4 align-items-center">
                <button onClick={onRegresar}>
                    <FontAwesomeIcon icon={faHouse} />
                    Inicio
                </button>
                <DropdownButton title={'Generar reporte'} variant="secondary">
                    <Dropdown.Item onClick={generarReportePDF}>
                        <FontAwesomeIcon icon={faFilePdf} /> PDF
                    </Dropdown.Item>
                    <Dropdown.Item onClick={generarReporteExcel}>
                        <FontAwesomeIcon icon={faFileExcel} /> Excel
                    </Dropdown.Item>
                </DropdownButton>
            </div>
        </div>
    );
};

export default DetalleFichas;
