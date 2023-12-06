import React, { useState, useEffect } from "react";
import DatePicker from 'react-date-picker';
import "react-date-picker/dist/DatePicker.css";
import { useAuth } from '../context/AuthContext';
import { getFirestore, collection, doc, getDoc, setDoc, getDocs } from 'firebase/firestore';

function Tecnico() {
    const { currentUser } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isSameDay, setIsSameDay] = useState(true);
    const [conformeNumero, setConformeNumero] = useState("");
    const [horaIngreso, setHoraIngreso] = useState("");
    const [horaEgreso, setHoraEgreso] = useState("");
    const [detalleTareas, setDetalleTareas] = useState("");
    const [totalHoras, setTotalHoras] = useState("");
    const [nombreTecnico, setNombreTecnico] = useState("");

    useEffect(() => {
        const fetchUserData = async () => {
            const db = getFirestore();
            const userRef = doc(collection(db, 'users'), currentUser.uid);
            const userSnapshot = await getDoc(userRef);

            if (userSnapshot.exists()) {
                const userData = userSnapshot.data();
                setTecnico(`${userData.apellido}, ${userData.nombre}`);
            }
        };

        fetchUserData();
    }, [currentUser.uid]);

    const setTecnico = (tecnico) => {
        setNombreTecnico(tecnico);
    };

    const handleDateChange = (date) => {
        setCurrentDate(date);
        setIsSameDay(false);
    };

    const handleCheckboxChange = () => {
        setIsSameDay(!isSameDay);
    };

    const handleTimeChange = (e, setTime) => {
        const { value } = e.target;
        const [hours, minutes] = value.split(":");
        const date = new Date();
        date.setHours(hours);
        date.setMinutes(minutes);
        setTime(date);
    };

    const calcularTotalHoras = () => {
        if (horaIngreso && horaEgreso) {
            const ingreso = new Date(horaIngreso);
            const egreso = new Date(horaEgreso);
            const diffMilliseconds = egreso - ingreso;
            const diffHours = diffMilliseconds / (1000 * 60 * 60);
            setTotalHoras(diffHours.toFixed(2));
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        calcularTotalHoras();

        const db = getFirestore();
        const horasRef = collection(db, 'horas');

        const querySnapshot = await getDocs(horasRef);
        const lastConforme = querySnapshot.docs[querySnapshot.docs.length - 1];
        let nextId = "000000";

        if (lastConforme) {
            const lastId = lastConforme.id;
            const numericId = parseInt(lastId, 10);
            nextId = (numericId + 1).toString().padStart(6, '0');
        }

        await setDoc(doc(horasRef, nextId), {
            fechaCarga: new Date(),
            fechaTrabajo: isSameDay ? currentDate : null,
            tecnico: nombreTecnico,
            nroConforme: conformeNumero,
            horaIngreso,
            horaEgreso,
            totalHoras,
            detalleTareas,
        });

        setCurrentDate(new Date());
        setIsSameDay(true);
        setConformeNumero("");
        setHoraIngreso("");
        setHoraEgreso("");
        setDetalleTareas("");
        setTotalHoras("");
    };

    return (
        <div>
            <h1>Técnico</h1>
            <form onSubmit={handleSubmit}>
                <label>
                    Fecha de trabajo:
                    <DatePicker
                        selected={currentDate}
                        onChange={handleDateChange}
                        disabled={isSameDay}
                    />
                </label>
                <label>
                    El conforme es de hoy
                    <input
                        type="checkbox"
                        checked={isSameDay}
                        onChange={handleCheckboxChange}
                    />
                </label>
                <label>
                    Nro. de Conforme de Servicio
                    <input
                        type="text"
                        value={conformeNumero}
                        onChange={(e) => setConformeNumero(e.target.value)}
                    />
                </label>
                <label>
                    Hora de Ingreso
                    <input
                        type="time"
                        value={horaIngreso}
                        onChange={(e) => handleTimeChange(e, setHoraIngreso)}
                    />
                </label>
                <label>
                    Hora de Egreso
                    <input
                        type="time"
                        value={horaEgreso}
                        onChange={(e) => handleTimeChange(e, setHoraEgreso)}
                    />
                </label>
                <label>
                    Total de Horas
                    <input
                        type="text"
                        value={totalHoras}
                        readOnly
                    />
                </label>
                <label>
                    Detalle de Tareas Realizadas
                    <textarea
                        value={detalleTareas}
                        onChange={(e) => setDetalleTareas(e.target.value)}
                    />
                </label>
                <button type="submit">Enviar</button>
            </form>
        </div>
    );
}

export default Tecnico;
