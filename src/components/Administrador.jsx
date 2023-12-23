import React, { useState, useEffect } from 'react';
import '../estilos/Administrador.css';
import { useAuth } from '../context/AuthContext';
import { getFirestore, doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { css } from '@emotion/react';
import { BarLoader } from 'react-spinners';

function Administrador() {
    const { currentUser } = useAuth();
    const [nombreAdministrador, setNombreAdministrador] = useState('');
    const [loading, setLoading] = useState(true);
    const [horasDelMes, setHorasDelMes] = useState(0);
    const [horasConformidad, setHorasConformidad] = useState(0);
    const [horasDisconformidad, setHorasDisconformidad] = useState(0);
    const [porcentajeConformidad, setPorcentajeConformidad] = useState(0);
    const [porcentajeDisconformidad, setPorcentajeDisconformidad] = useState(0);
    const [cantidadConformes, setCantidadConformes] = useState(0);
    const currentDate = new Date();
    const capitalizeFirstLetter = (string) => {
        return string.charAt(0).toUpperCase() + string.slice(1);
    };
    const currentMonth = capitalizeFirstLetter(currentDate.toLocaleString('es-ES', { month: 'long' }));

    const sumarHoras = (hora1, hora2) => {
        const [horas1, minutos1] = hora1.split(':').map(Number);
        const [horas2, minutos2] = hora2.split(':').map(Number);

        const totalHoras = horas1 + horas2;
        const totalMinutos = minutos1 + minutos2;

        const horasResultado = totalHoras + Math.floor(totalMinutos / 60);
        const minutosResultado = totalMinutos % 60;

        // Formatear el resultado como hh:mm
        const resultado = `${String(horasResultado).padStart(2, '0')}:${String(minutosResultado).padStart(2, '0')}`;
        return resultado;
    };

    useEffect(() => {
        if (!currentUser) {
            return;
        }

        const fetchData = async () => {
            try {
                const db = getFirestore();

                // Obtener todas las horas cargadas por los técnicos
                const horasQuery = await getDocs(collection(db, 'horas'));
                const totalHoras = horasQuery.docs.reduce((acc, doc) => {
                    const cantidadHoras = doc.data().cantidadHoras;
                    return sumarHoras(acc, cantidadHoras);
                }, '00:00');
                setHorasDelMes(totalHoras);

                // Obtener todas las horas firmadas en conformidad
                const conformidadQuery = await getDocs(query(collection(db, 'horas'), where('firmado.tipo', '==', 'conformidad')));
                const totalConformidad = conformidadQuery.docs.reduce((acc, doc) => {
                    const cantidadHoras = doc.data().cantidadHoras;
                    return sumarHoras(acc, cantidadHoras);
                }, '00:00');
                setHorasConformidad(totalConformidad);

                //Obtener el porcentaje de conformidad
                const totalHorasConformidad = totalConformidad.split(':').map(Number);
                const totalHorasMes = totalHoras.split(':').map(Number);
                const porcentaje = (totalHorasConformidad[0] * 60 + totalHorasConformidad[1]) / (totalHorasMes[0] * 60 + totalHorasMes[1]) * 100;
                setPorcentajeConformidad(porcentaje.toFixed(2) + '%');

                // Obtener todas las horas firmadas en disconformidad
                const disconformidadQuery = await getDocs(query(collection(db, 'horas'), where('firmado.tipo', '==', 'disconformidad')));
                const totalDisconformidad = disconformidadQuery.docs.reduce((acc, doc) => {
                    const cantidadHoras = doc.data().cantidadHoras;
                    return sumarHoras(acc, cantidadHoras);
                }, '00:00');
                setHorasDisconformidad(totalDisconformidad);

                //Obtener el porcentaje de disconformidad
                const totalHorasDisconformidad = totalDisconformidad.split(':').map(Number);
                const porcentajeDisconformidad = (totalHorasDisconformidad[0] * 60 + totalHorasDisconformidad[1]) / (totalHorasMes[0] * 60 + totalHorasMes[1]) * 100;
                setPorcentajeDisconformidad(porcentajeDisconformidad.toFixed(2) + '%');

                // Obtener el nombre del administrador
                const userDoc = doc(collection(db, 'users'), currentUser.uid);
                const userSnapshot = await getDoc(userDoc);

                // Obtener la cantidad de conformes totales

                const conformesQuery = await getDocs(collection(db, 'horas'));
                const cantidadConformes = conformesQuery.size;
                setCantidadConformes(cantidadConformes);

                if (userSnapshot.exists()) {
                    const userData = userSnapshot.data();
                    const nombreAdministrador = userData.name;
                    setNombreAdministrador(nombreAdministrador);
                }
                setLoading(false);
            } catch (error) {
                console.error('Error fetching data:', error);
                setLoading(false);
            }
        };

        fetchData();
    }, [currentUser]);

    const Spinner = () => {
        const override = css`
            display: block;
            margin: 0 auto;
        `;

        return <BarLoader color="#36D7B7" loading css={override} />;
    };

    return (
        <div className="administrador-container bg-dark text-light">
            {loading ? (
                <div className='spinner-container'>
                    <h1>Cargando...</h1>
                    <Spinner />
                </div>
            ) : (
                <div className="contenido-container">
                    <h1>Administrador</h1>
                    <h3>Bienvenido, {nombreAdministrador}</h3>
                    <div className="dashboard">
                        <div className="cantidadConformes p-4">
                            <button className="p-4">
                                <h4>Conformes:</h4>
                                <h5>{cantidadConformes}</h5>
                            </button>
                        </div>
                        <div className="horasDelMes p-4">
                            <button className='p-4'>
                                <h4>Hs. totales:</h4>
                                <h5>{horasDelMes}</h5>
                            </button>
                        </div>
                        <div className="horasConformidad p-4">
                            <button className='p-4'>
                                <h4>Conformidad: {porcentajeConformidad}</h4>
                                <h5>{horasConformidad} hs.</h5>
                            </button>
                        </div>
                        <div className="horasDisconformidad p-4">
                            <button className='p-4'>
                                <h4>Disconformidad: {porcentajeDisconformidad}</h4>
                                <h5>{horasDisconformidad} hs.</h5>
                            </button>
                        </div>
                        <div className="administrarUsuarios p-4">
                            <button className='p-4'>
                                <h5>Administrar usuarios</h5>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Administrador;
