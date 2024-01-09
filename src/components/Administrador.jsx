import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { css } from '@emotion/react';
import { BarLoader } from 'react-spinners';
import { Container, Row, Col, Card } from 'react-bootstrap';
import '../estilos/Administrador.css';
import { PieChart } from '@mui/x-charts';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import moment from 'moment';

function Administrador() {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState(null);
    const [totalHoras, setTotalHoras] = useState(0);

    const formatTotalHoras = (totalMinutos) => {
        const horas = Math.floor(totalMinutos / 60);
        const minutos = totalMinutos % 60;
        return `${horas}:${minutos.toString().padStart(2, '0')}hs`;
    };

    const formattedChartData = chartData
        ? chartData.map(item => ({
            ...item,
            value: Number(item.value) || 0,  // Asegura que 'value' sea un número, o usa 0 si no es un número válido
        }))
        : [];

    const TooltipContent = ({ datum, color }) => {
        return (
            <div style={{ color }}>
                <strong>{datum.label}</strong>: {formatDuration(datum.value)}
            </div>
        );
    };

    useEffect(() => {

        const formatDuration = (durationInMinutes) => {
            const hours = Math.floor(durationInMinutes / 60);
            const minutes = durationInMinutes % 60;
            return `${hours}:${minutes.toString().padStart(2, '0')}hs`;
        };

        const fetchData = async () => {
            try {
                const db = getFirestore();

                // Obtén la fecha actual y el primer día del mes
                const currentDate = moment();
                const firstDayOfMonth = currentDate.clone().startOf('month').format('YYYY-MM-DD');

                // Consulta para obtener las horas del mes actual
                const querySnapshot = await getDocs(
                    query(collection(db, 'horas'), where('fechaConforme', '>=', firstDayOfMonth))
                );

                // Procesa los resultados para obtener la cantidad total, conformes y disconformes
                let conformesFirmadosConformidad = 0;
                let conformesFirmadosDisconformidad = 0;
                let conformesNoFirmados = 0;
                let totalMinutos = 0;

                querySnapshot.forEach((doc) => {
                    const data = doc.data();

                    // Asegúrate de tener un formato de fecha consistente
                    const fechaConforme = moment(data.fechaConforme, 'YYYY-MM-DD');

                    // Verifica que la fecha esté dentro del mes actual
                    if (fechaConforme.isSameOrBefore(currentDate, 'month')) {
                        if (data.firmado) {
                            if (data.firmado.tipo === 'conformidad') {
                                conformesFirmadosConformidad += moment.duration(data.cantidadHoras).asMinutes();
                            } else if (data.firmado.tipo === 'disconformidad') {
                                conformesFirmadosDisconformidad += moment.duration(data.cantidadHoras).asMinutes();
                            }
                        } else {
                            conformesNoFirmados += moment.duration(data.cantidadHoras).asMinutes();
                        }
                    }
                });

                totalMinutos = conformesFirmadosConformidad + conformesFirmadosDisconformidad + conformesNoFirmados;
                setTotalHoras(totalMinutos);

                // Crea el objeto de datos para el gráfico
                const chartData = [
                    { id: 0, value: conformesFirmadosConformidad, label: 'Conformidad', color: 'green' },
                    { id: 1, value: conformesFirmadosDisconformidad, label: 'Disconformidad', color: 'red' },
                    { id: 2, value: conformesNoFirmados, label: 'No Firmados', color: 'blue' },
                ];

                setChartData(chartData);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching data:', error);
                setLoading(false);
            }
        };

        if (currentUser) {
            fetchData();
        }
    }, [currentUser]);

    const Spinner = () => {
        const override = css`
            display: block;
            margin: 0 auto;
        `;

        return <BarLoader className='rounded' color="white" loading css={override} />;
    };

    return (
        <div className="administrador-container bg-dark text-light">
            {loading ? (
                <div className='spinner-container'>
                    <p>Cargando...</p>
                    <Spinner />
                </div>
            ) : (
                <Container fluid>
                    <Row>
                        <Col xs={12} md={6} lg={4}>
                            <Card className='p-1'>
                                <h5 className='text-center'>Dashboard</h5>
                                <Card.Body className=''>
                                    <PieChart
                                        series={[{
                                            data: formattedChartData,
                                            innerRadius: 20,
                                            outerRadius: 50,
                                            paddingAngle: 2,
                                            cornerRadius: 5,
                                            startAngle: -90,
                                            endAngle: 180,
                                            cx: 50
                                        }]}
                                        width={300}
                                        height={100}
                                        tooltip={<TooltipContent />}
                                    />
                                    <span>Total: {formatTotalHoras(totalHoras)}</span>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xs={12} md={6} lg={4}>
                            <Card>
                                <Card.Body>
                                    {/* Contenido de la segunda card */}
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xs={12} md={6} lg={4}>
                            <Card>
                                <Card.Body>
                                    {/* Contenido de la tercera card */}
                                </Card.Body>
                            </Card>
                        </Col>
                        {/* Puedes agregar más columnas según sea necesario */}
                    </Row>
                </Container>
            )}
        </div>
    );
}

export default Administrador;
