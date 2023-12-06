// AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { Navigate } from 'react-router-dom';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoading(false);
        });

        // Configurar el temporizador para cerrar la sesión después de 15 minutos de inactividad
        let timeoutId;
        // Función para convertir minutos a milisegundos
        const minutesToMilliseconds = (minutes) => minutes * 60 * 1000;
        // Uso de la función para establecer el tiempo de inactividad en 15 minutos
        const inactivityTimeout = minutesToMilliseconds(1);

        const resetTimeout = () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            timeoutId = setTimeout(() => {
                logout();
                console.log('Sesión cerrada por inactividad');
            }, inactivityTimeout);
        };

        const handleActivity = () => {
            resetTimeout();
        };

        // Configurar el listener de actividad
        window.addEventListener('mousemove', handleActivity);
        window.addEventListener('keydown', handleActivity);

        return () => {
            unsubscribe();
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('keydown', handleActivity);
            resetTimeout(); // Limpiar el temporizador al desmontar el componente
        };
    }, []);

    const value = {
        currentUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading ? (
                children
            ) : (
                <div>Loading...</div>
            )}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
