import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { css } from '@emotion/react';
import { BarLoader } from 'react-spinners';
import { Container, Row, Col, Card } from 'react-bootstrap';
import '../estilos/Administrador.css';
import { PieChart } from '@mui/x-charts/PieChart';
import { getFirestore, collection, getDocs, query } from 'firebase/firestore';
import moment from 'moment';
import { IoMdPaper } from "react-icons/io";
import { FaUsers } from "react-icons/fa";
import DetalleFichas from './DetalleFichas.jsx';
import ManageUsers from './ManageUsers.jsx';

const Administrador = () => {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState(null);
    const [totalHoras, setTotalHoras] = useState(0);
    const [promedioHoras, setPromedioHoras] = useState(0);
    const [chartDataPromedio, setChartDataPromedio] = useState([]);
    const [mostrarDetalles, setMostrarDetalles] = useState(false);
    const [mostrarUsuarios, setMostrarUsuarios] = useState(false);

    const formatTotalHoras = (totalMinutos) => {
        if (isNaN(totalMinutos) || totalMinutos === 0) {
            return 'N/A';
        }
        const horas = Math.floor(totalMinutos / 60);
        const minutos = Math.ceil(totalMinutos % 60);
        return `${horas}:${minutos.toString().padStart(2, '0')}hs`;
    };

    const formattedChartData = chartData
        ? chartData.map((item) => ({
            ...item,
            value: Number(item.value) || 0,
        }))
        : [];

    const TooltipContent = ({ datum, color }) => {
        const formattedValue = formatDuration(datum.value);
        return (
            <div style={{ color }}>
                <strong>{datum.label}</strong>: {formattedValue}
            </div>
        );
    };

    const formatDuration = (durationInMinutes) => {
        const hours = Math.floor(durationInMinutes / 60);
        const minutes = durationInMinutes % 60;
        return `${hours}:${minutes.toString().padStart(2, '0')}hs`;
    };

    const getFirestoreData = async () => {
        try {
            const db = getFirestore();
            const currentDate = moment();
            const firstDayOfMonth = currentDate.clone().startOf('month').format('YYYY-MM-DD');
            const [querySnapshot, usersSnapshot] = await Promise.all([
                getDocs(query(collection(db, 'horas'))),
                getDocs(collection(db, 'users')),
            ]);
            const fichasSnapshot = querySnapshot;
            const usersData = usersSnapshot.docs.map((doc) => doc.data());
            const tecnicosUsers = usersData.filter((user) => user.role === 'tecnico');
            let fichasFirmadosConformidad = 0;
            let fichasFirmadosDisconformidad = 0;
            let fichasNoFirmados = 0;
            let totalMinutos = 0;
            const horasPorTecnico = getHorasPorTecnico(fichasSnapshot.docs);
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const fechaFicha = moment(data.fechaFicha, 'YYYY-MM-DD');
                if (fechaFicha.isSameOrBefore(currentDate, 'month')) {
                    if (data.firmado) {
                        if (data.firmado.tipo === 'conformidad') {
                            fichasFirmadosConformidad += moment.duration(data.cantidadHoras).asMinutes();
                        } else if (data.firmado.tipo === 'disconformidad') {
                            fichasFirmadosDisconformidad += moment.duration(data.cantidadHoras).asMinutes();
                        }
                    } else {
                        fichasNoFirmados += moment.duration(data.cantidadHoras).asMinutes();
                    }
                }
            });
            totalMinutos = fichasFirmadosConformidad + fichasFirmadosDisconformidad + fichasNoFirmados;
            setTotalHoras(totalMinutos);
            const chartData = [
                { id: 0, value: fichasFirmadosConformidad, label: 'Conformes', color: '#31ca71' },
                { id: 1, value: fichasFirmadosDisconformidad, label: 'Disconformes', color: '#E95646' },
                { id: 2, value: fichasNoFirmados, label: 'No firmados', color: '#ffb' },
            ];
            setChartData(chartData);
            const chartDataPromedio = Object.entries(horasPorTecnico).map(([tecnico, minutos], index) => ({
                id: index,
                value: minutos,
                label: tecnico,
                color: getRandomContrastColor(),
            }));
            setChartDataPromedio(chartDataPromedio);
            setLoading(false);
            const promedioHorasPorTecnico = getPromedioHorasPorTecnico(horasPorTecnico);
            setPromedioHoras(promedioHorasPorTecnico);
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    };

    const isColorDark = (color) => {
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness < 128;
    };

    const getRandomColor = () => {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    };

    const getRandomContrastColor = () => {
        let color;
        do {
            color = getRandomColor();
        } while (isColorDark(color));
        return color;
    };


    const getHorasPorTecnico = (fichas) => {
        const horasPorTecnico = {};
        fichas.forEach((ficha) => {
            const data = ficha.data();
            const tecnico = data.tecnico;
            if (tecnico) {
                const cantidadHoras = moment.duration(data.cantidadHoras).asMinutes();
                if (horasPorTecnico[tecnico]) {
                    horasPorTecnico[tecnico] += cantidadHoras;
                } else {
                    horasPorTecnico[tecnico] = cantidadHoras;
                }
            }
        });
        return horasPorTecnico;
    };

    const getPromedioHorasPorTecnico = (horasPorTecnico) => {
        const cantidadTecnicos = Object.keys(horasPorTecnico).length;
        const totalHoras = Object.values(horasPorTecnico).reduce((total, horas) => total + horas, 0);
        const promedioHoras = totalHoras / cantidadTecnicos;
        return promedioHoras;
    };

    useEffect(() => {
        currentUser ? getFirestoreData() : setLoading(false);
    }, [currentUser]);

    const Spinner = () => {
        const override = css`
            display: block;
            margin: 0 auto;
        `;

        return <BarLoader className='rounded' color="white" loading css={override} />;
    };

    const handleMostrarDetallesClick = (verDetalle) => {
        setMostrarDetalles(verDetalle);
    };

    const handleMostrarUsuariosClick = (verUsuarios) => {
        setMostrarUsuarios(verUsuarios);
    };

    return (
        <div className="administrador-container bg-dark text-light">
            {loading ? (
                <div className='spinner-container'>
                    <p>Cargando...</p>
                    <Spinner />
                </div>
            ) : (
                mostrarDetalles ? (
                    <DetalleFichas onRegresar={() => handleMostrarDetallesClick(false)} />
                ) : (
                    mostrarUsuarios ? (
                        <ManageUsers onRegresar={() => handleMostrarUsuariosClick(false)} />
                    ) : (
                        <Container fluid>
                            <Row>
                                <Col md={6}>
                                    <Card className='card'>
                                        <Card.Header className='text-center'>Horas de trabajo</Card.Header>
                                        {
                                            totalHoras > 0 ? (
                                                <>
                                                    {window.innerWidth < 768 && (<PieChart
                                                        className='horasChart'
                                                        series={[
                                                            {
                                                                arcLabel: (item) => formatDuration(item.value),
                                                                arcLabelMinAngle: 20,
                                                                data: formattedChartData,
                                                                innerRadius: 20,
                                                                outerRadius: 80,
                                                                paddingAngle: 5,
                                                                cornerRadius: 8,
                                                                cx: 90,
                                                                cy: 100,
                                                            },
                                                        ]}
                                                        height={200}
                                                        width={360}
                                                        tooltip={<TooltipContent />}
                                                    />)}
                                                    {window.innerWidth > 768 && (<PieChart
                                                        className='horasChart'
                                                        series={[
                                                            {
                                                                arcLabel: (item) => formatDuration(item.value),
                                                                arcLabelMinAngle: 20,
                                                                data: formattedChartData,
                                                                innerRadius: 30,
                                                                outerRadius: 100,
                                                                paddingAngle: 5,
                                                                cornerRadius: 8,
                                                                cx: 150,
                                                                cy: 120,
                                                            },
                                                        ]}
                                                        height={250}
                                                        width={700}
                                                        tooltip={<TooltipContent />}
                                                    />)}
                                                </>
                                            ) : (
                                                <Card.Body className='text-center'>
                                                    <p>No hay datos para mostrar</p>
                                                </Card.Body>
                                            )
                                        }
                                        <Card.Footer className='text-center'>Total: {formatTotalHoras(totalHoras)}</Card.Footer>
                                    </Card>
                                </Col>
                                <Col md={6}>
                                    <Card className='card'>
                                        <Card.Header className='text-center'>Hs. / Técnico</Card.Header>
                                        {
                                            promedioHoras > 0 ? (
                                                <>
                                                    {window.innerWidth < 768 && (<PieChart
                                                        className='promedioChart'
                                                        series={[
                                                            {
                                                                arcLabel: (item) => formatDuration(item.value),
                                                                arcLabelMinAngle: 10,
                                                                data: chartDataPromedio,
                                                                innerRadius: 20,
                                                                outerRadius: 80,
                                                                paddingAngle: 5,
                                                                cornerRadius: 8,
                                                                cx: 90,
                                                                cy: 100,
                                                            },
                                                        ]}
                                                        height={200}
                                                        width={360}
                                                        tooltip={<TooltipContent />}
                                                    />)}
                                                    {window.innerWidth > 768 && (<PieChart
                                                        className='horasChart'
                                                        series={[
                                                            {
                                                                arcLabel: (item) => formatDuration(item.value),
                                                                arcLabelMinAngle: 10,
                                                                data: chartDataPromedio,
                                                                innerRadius: 30,
                                                                outerRadius: 100,
                                                                paddingAngle: 5,
                                                                cornerRadius: 8,
                                                                cx: 150,
                                                                cy: 120,
                                                            },
                                                        ]}
                                                        height={250}
                                                        width={700}
                                                        tooltip={<TooltipContent />}
                                                    />)}
                                                </>
                                            ) : (
                                                <Card.Body className='text-center'>
                                                    <p>No hay datos para mostrar</p>
                                                </Card.Body>
                                            )}
                                        <Card.Footer className='text-center'>Promedio: {formatTotalHoras(promedioHoras)}/tec</Card.Footer>
                                    </Card>
                                </Col>
                            </Row>
                            <Row>
                                <Col md={6}>
                                    <Card className='card mostrarDetalles text-center' onClick={() => handleMostrarDetallesClick(!mostrarDetalles)}>
                                        <Card.Header className='text-center'>Mas informacion</Card.Header>
                                        <Card.Body className='text-center mostrarDetallesBody'>
                                            <IoMdPaper className='paperIcon' />
                                            <span>Ver historico</span>
                                        </Card.Body>
                                        <Card.Footer className='text-center'>Generar reportes, editar, eliminar fichas, etc.</Card.Footer>
                                    </Card>
                                </Col>
                                <Col md={6}>
                                    <Card className='card usuarios text-center' onClick={() => handleMostrarUsuariosClick(!mostrarUsuarios)}>
                                        <Card.Header className='text-center'>Administracion de usuarios</Card.Header>
                                        <Card.Body className='text-center usuariosBody'>
                                            <FaUsers className='usuariosIcon' />
                                            <span>Administrar usuarios</span>
                                        </Card.Body>
                                        <Card.Footer className='text-center'>Crear, editar, eliminar usuarios, etc.</Card.Footer>
                                    </Card>
                                </Col>
                            </Row>
                        </Container>
                    )
                )
            )
            }
        </div>
    );
};

export default Administrador;