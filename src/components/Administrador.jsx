import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { css } from '@emotion/react';
import { BarLoader } from 'react-spinners';
import { Container, Row, Col, Card } from 'react-bootstrap';
import '../estilos/Administrador.css';
import { PieChart } from '@mui/x-charts/PieChart';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import moment from 'moment';

function Administrador() {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState(null);
    const [totalHoras, setTotalHoras] = useState(0);

    const formatTotalHoras = (totalMinutos) => {
        if (isNaN(totalMinutos) || totalMinutos === 0) {
            return 'N/A';
        }
        const horas = Math.floor(totalMinutos / 60);
        const minutos = totalMinutos % 60;
        return `${horas}:${minutos.toString().padStart(2, '0')}hs`;
    };

    const formattedChartData = chartData
        ? chartData.map(item => ({
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

    useEffect(() => {
        const fetchData = async () => {
            try {
                const db = getFirestore();
                const currentDate = moment();
                const firstDayOfMonth = currentDate.clone().startOf('month').format('YYYY-MM-DD');

                const querySnapshot = await getDocs(
                    query(collection(db, 'horas'), where('fechaConforme', '>=', firstDayOfMonth))
                );

                let conformesFirmadosConformidad = 0;
                let conformesFirmadosDisconformidad = 0;
                let conformesNoFirmados = 0;
                let totalMinutos = 0;

                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    const fechaConforme = moment(data.fechaConforme, 'YYYY-MM-DD');

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

                const chartData = [
                    { id: 0, value: conformesFirmadosConformidad, label: 'Conformidad', color: '#31ca71' },
                    { id: 1, value: conformesFirmadosDisconformidad, label: 'Disconformidad', color: '#E95646' },
                    { id: 2, value: conformesNoFirmados, label: 'No Firmados', color: '#ffb' },
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
                        <Col md={6}>
                            <Card className='card'>
                                <Card.Header className='text-center'>Horas de trabajo</Card.Header>
                                <PieChart
                                    series={[
                                        {
                                            arcLabel: (item) => formatDuration(item.value),
                                            arcLabelMinAngle: 45,
                                            data: formattedChartData,
                                            innerRadius: 20,
                                            outerRadius: 80,
                                            paddingAngle: 5,
                                            cornerRadius: 8,
                                            cx: 100,
                                            cy: 100,
                                        },
                                    ]}
                                    height={200}
                                    tooltip={<TooltipContent />}
                                />
                                <Card.Footer className='text-center'>Total: {formatTotalHoras(totalHoras)}</Card.Footer>
                            </Card>
                        </Col>
                        <Col md={6}>
                            <Card className='card'>
                                <Card.Header className='text-center'>Hs. / Técnico</Card.Header>

                                <Card.Footer className='text-center'>
                                    Promedio: {0}
                                </Card.Footer>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            )}
        </div>
    );
}

export default Administrador;
