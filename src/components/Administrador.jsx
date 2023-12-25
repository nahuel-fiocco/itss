import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import { css } from '@emotion/react';
import { BarLoader } from 'react-spinners';
import '../estilos/Administrador.css';

function Administrador() {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        horasDelMes: '00:00',
        horasConformidad: '00:00',
        horasDisconformidad: '00:00',
        porcentajeConformidad: 0,
        porcentajeDisconformidad: 0,
        cantidadConformes: 0,
    });

    const [currentView, setCurrentView] = useState('conformes');

    const handleConformesClick = () => setCurrentView('conformes');
    const handleHorasTotalesClick = () => setCurrentView('horasTotales');
    const handleConformidadClick = () => setCurrentView('conformidad');
    const handleDisconformidadClick = () => setCurrentView('disconformidad');

    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleString('es-ES', { month: 'long' });

    const sumarHoras = (hora1, hora2) => {
        const [horas1, minutos1] = hora1.split(':').map(Number);
        const [horas2, minutos2] = hora2.split(':').map(Number);

        const totalHoras = horas1 + horas2;
        const totalMinutos = minutos1 + minutos2;

        const horasResultado = totalHoras + Math.floor(totalMinutos / 60);
        const minutosResultado = totalMinutos % 60;

        const resultado = `${String(horasResultado).padStart(2, '0')}:${String(minutosResultado).padStart(2, '0')}`;
        return resultado;
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const db = getFirestore();

                const horasQuery = await getDocs(collection(db, 'horas'));
                const totalHoras = horasQuery.docs.reduce((acc, doc) => {
                    const cantidadHoras = doc.data().cantidadHoras;
                    return sumarHoras(acc, cantidadHoras);
                }, '00:00');

                const conformidadQuery = await getDocs(query(collection(db, 'horas'), where('firmado.tipo', '==', 'conformidad')));
                const totalConformidad = conformidadQuery.docs.reduce((acc, doc) => {
                    const cantidadHoras = doc.data().cantidadHoras;
                    return sumarHoras(acc, cantidadHoras);
                }, '00:00');

                const totalHorasConformidad = totalConformidad.split(':').map(Number);
                const totalHorasMes = totalHoras.split(':').map(Number);
                const porcentajeConformidad = (totalHorasConformidad[0] * 60 + totalHorasConformidad[1]) / (totalHorasMes[0] * 60 + totalHorasMes[1]) * 100;

                const disconformidadQuery = await getDocs(query(collection(db, 'horas'), where('firmado.tipo', '==', 'disconformidad')));
                const totalDisconformidad = disconformidadQuery.docs.reduce((acc, doc) => {
                    const cantidadHoras = doc.data().cantidadHoras;
                    return sumarHoras(acc, cantidadHoras);
                }, '00:00');

                const totalHorasDisconformidad = totalDisconformidad.split(':').map(Number);
                const porcentajeDisconformidad = (totalHorasDisconformidad[0] * 60 + totalHorasDisconformidad[1]) / (totalHorasMes[0] * 60 + totalHorasMes[1]) * 100;

                const conformesQuery = await getDocs(collection(db, 'horas'));
                const cantidadConformes = conformesQuery.size;

                setStats({
                    horasDelMes: totalHoras,
                    horasConformidad: totalConformidad,
                    horasDisconformidad: totalDisconformidad,
                    porcentajeConformidad: porcentajeConformidad.toFixed(2),
                    porcentajeDisconformidad: porcentajeDisconformidad.toFixed(2),
                    cantidadConformes,
                });

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

        return <BarLoader className='rounded' color="#36D7B7" loading css={override} />;
    };

    return (
        <div className="administrador-container bg-dark text-light">
            {loading ? (
                <div className='spinner-container'>
                    <p>Cargando...</p>
                    <Spinner />
                </div>
            ) : (
                <div className="contenido-container">
                    <div className="dashboard">
                        <div className="cantidadConformes">
                            <button className="p-2">
                                <h6>📜 {stats.cantidadConformes}</h6>
                                <h5>conformes</h5>
                            </button>
                        </div>
                        <div className="horasDelMes">
                            <button className='p-2'>
                                <h6>⌛ {stats.horasDelMes}hs.</h6>
                                <h5>totales</h5>
                            </button>
                        </div>
                        <div className="horasConformidad">
                            <button className='p-2'>
                                <h6>✅ {stats.porcentajeConformidad}%</h6>
                                <h5>conformidad</h5>
                                <h6></h6>
                            </button>
                        </div>
                        <div className="horasDisconformidad">
                            <button className='p-2'>
                                <h6>❌ {stats.porcentajeDisconformidad}%</h6>
                                <h5>disconformidad</h5>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Administrador;
