import React, { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, onSnapshot, doc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import '../estilos/DetalleConformes.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faTrash, faInfoCircle, faHouse, faFilePdf, faFileExcel } from '@fortawesome/free-solid-svg-icons';
import { Dropdown, DropdownButton, OverlayTrigger, Popover, Table } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import jsPDF from 'jspdf';
import ExcelJS from 'exceljs';

const ConformeDetalles = ({ onRegresar }) => {
    const [expanded, setExpanded] = useState(null);
    const [horasTrabajo, setHorasTrabajo] = useState([]);
    const [modoEdicion, setModoEdicion] = useState(false);
    const [horaEditando, setHoraEditando] = useState(null);
    const [tecnico, setTecnico] = useState('');
    const { currentUser } = useAuth();
    const [fechaConforme, setFechaConforme] = useState('');
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
                    setFechaConforme(horaEditando.fechaConforme);
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
                    <label className="label">Nro. Conforme</label>
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

    const cancelarEdicion = () => {
        setHoraEditando(null);
        setModoEdicion(false);
    };

    const guardarCambios = async () => {
        try {
            const db = getFirestore();
            const conformesCollection = collection(db, 'horas');
            const conformesDoc = doc(conformesCollection, horaEditando.id);

            // Actualiza el documento con los nuevos datos
            await updateDoc(conformesDoc, {
                fechaConforme,
                horaComienzo,
                horaFinalizacion,
                cantidadHoras,
                detalleTareas,
            });

            // Restablece el estado de edición
            setModoEdicion(false);
            setHoraEditando(null);

            console.log('Conformé actualizado correctamente.');
        } catch (error) {
            console.error('Error al actualizar el conformé:', error);
        }
    };

    const iniciarEdicion = (hora) => {
        setModoEdicion(true);
        setHoraEditando(hora);
    };

    const eliminarConforme = async (hora) => {
        try {
            if (hora) {
                const db = getFirestore();
                const conformesCollection = collection(db, 'horas');

                // Utiliza el ID del conforma para eliminar el documento correspondiente
                await deleteDoc(doc(conformesCollection, hora.id));
                setModoEdicion(false);
                setHoraEditando(null);
            } else {
                console.error('No se proporcionó información del conforma para eliminar.');
            }
        } catch (error) {
            console.error('Error al eliminar el documento:', error);
        }
    };


    const handleFechaConformeChange = (e) => {
        setFechaConforme(e.target.value);
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

        const horaLaboralInicio = new Date(0, 0, 0, 9, 0); // Hora de inicio del horario laboral
        const horaLaboralFin = new Date(0, 0, 0, 18, 0); // Hora de fin del horario laboral

        if (inicio >= horaLaboralInicio && fin <= horaLaboralFin) {
            return 'Ordinaria';
        } else if ((inicio < horaLaboralInicio && fin <= horaLaboralInicio) || (inicio >= horaLaboralFin && fin > horaLaboralFin)) {
            return 'Extraordinaria';
        } else {
            console.error('Las horas ordinarias y extraordinarias deben estar en conformes diferentes.');
            return '';
        }
    };

    const renderHistorialMobile = () => {
        if (horasTrabajo.length === 0) {
            return <p>No hay conformes cargados</p>;
        }
        return (
            < div className="historial-mobile" >
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
                                        <p><strong>Tipo de Tarea:</strong> {hora.tipoTareaCalculado}</p>
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
                                        <button type="button" onClick={() => eliminarConforme(hora)}>
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
            return <p>No hay conformes cargados</p>;
        }
        return (
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
                        <th>Editar</th>
                        <th>Eliminar</th>
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
                                <button type="button" onClick={() => eliminarConforme(hora)}>
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

    const generarReportePDF = () => {
        // Crea un nuevo documento PDF
        const pdfDoc = new jsPDF();

        // Título centrado horizontalmente
        pdfDoc.text("Reporte de Conformes de Servicio", pdfDoc.internal.pageSize.getWidth() / 2, 80, { align: 'center' });

        horasTrabajo.forEach((hora, index) => {
            const yPos = 30 + index * 90; // Incrementé el espacio vertical para mayor separación entre conformes

            // // Títulos contra el margen izquierdo y valores contra el margen derecho
            // pdfDoc.text(`Conforme nro: ${index + 1}`, 20, yPos);
            // pdfDoc.text(`Fecha: ${hora.fechaConforme}`, pdfDoc.internal.pageSize.getWidth() - 20, yPos, { align: 'right' });
            // pdfDoc.text(`Técnico: ${hora.tecnico}`, pdfDoc.internal.pageSize.getWidth() - 20, yPos + 10, { align: 'right' });
            // pdfDoc.text(`Hora Comienzo: ${hora.horaComienzo} hs.`, 20, yPos + 20);
            // pdfDoc.text(`Hora Finalización: ${hora.horaFinalizacion} hs.`, 20, yPos + 30);
            // pdfDoc.text(`Cantidad de Horas: ${hora.cantidadHoras} hs.`, 20, yPos + 40);
            // pdfDoc.text(`Tipo de Tarea: ${hora.tipoTareaCalculado}`, 20, yPos + 50);
            // pdfDoc.text(`Detalle de Tareas: ${hora.detalleTareas}`, 20, yPos + 60);
            // pdfDoc.text(`Fecha de Creación: ${hora.fechaCreacion}`, pdfDoc.internal.pageSize.getWidth() - 20, yPos + 70, { align: 'right' });
            // pdfDoc.text(`Hora de Creación: ${hora.horaCreacion}`, pdfDoc.internal.pageSize.getWidth() - 20, yPos + 80, { align: 'right' });
            // pdfDoc.text(`Firmado: ${renderFirmado(hora)}`, pdfDoc.internal.pageSize.getWidth() - 20, yPos + 90, { align: 'right' });

            pdfDoc.text('Conforme nro:', 20, yPos);
            pdfDoc.text(`${index + 1}`, 80, yPos);

            // Línea de guiones
            pdfDoc.text('----------------------------------------', 20, yPos + 100);
        });

        // Guarda el documento como archivo PDF
        pdfDoc.save('historial_conformes.pdf');
    };

    const generarReporteExcel = async () => {
        try {
            // Crea un nuevo libro de Excel
            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet('Historial Conformes');

            // Define las columnas del encabezado en el archivo Excel
            sheet.columns = [
                { header: 'Nro. Conforme', key: 'nroConforme', width: 15 },
                { header: 'Técnico', key: 'tecnico', width: 30 },
                { header: 'Fecha Conforme', key: 'fechaConforme', width: 15 },
                { header: 'Hora Comienzo', key: 'horaComienzo', width: 15 },
                { header: 'Hora Finalización', key: 'horaFinalizacion', width: 15 },
                { header: 'Cantidad de Horas', key: 'cantidadHoras', width: 15 },
                { header: 'Tipo de Tarea', key: 'tipoTareaCalculado', width: 20 },
                { header: 'Detalle de Tareas', key: 'detalleTareas', width: 30 },
                { header: 'Fecha de Creación', key: 'fechaCreacion', width: 15 },
                { header: 'Firmado', key: 'firmado', width: 15 }
                // Añade más columnas según tus necesidades
            ];

            // Agrega los datos de cada conformé a la hoja de cálculo
            horasTrabajo.forEach((hora) => {
                sheet.addRow({
                    nroConforme: hora.nroConforme,
                    tecnico: hora.tecnico,
                    fechaConforme: hora.fechaConforme,
                    horaComienzo: hora.horaComienzo,
                    horaFinalizacion: hora.horaFinalizacion,
                    cantidadHoras: hora.cantidadHoras,
                    tipoTareaCalculado: calcularTipoTarea(hora.horaComienzo, hora.horaFinalizacion),
                    detalleTareas: hora.detalleTareas,
                    fechaCreacion: hora.fechaCreacion,
                    firmado: renderFirmado(hora),
                    // Agrega más propiedades según tus necesidades
                });
            });

            // Guarda el libro de Excel como archivo
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = URL.createObjectURL(blob);

            // Crea un enlace y simula un clic para iniciar la descarga
            const link = document.createElement('a');
            link.href = url;
            link.download = 'historial_conformes.xlsx';
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
                        {window.innerWidth > 768 ? <h3>Historial de conformes</h3> : <h5>Detalle historico de conformes</h5>}
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

export default ConformeDetalles;
