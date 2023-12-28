import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(undefined);
    const [userTimeOut, setUserTimeOut] = useState(15);

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
        });

        let timeoutId;
        const minutesToMilliseconds = (minutes) => minutes * 60 * 1000;
        const inactivityTimeout = minutesToMilliseconds(userTimeOut);

        const resetTimeout = () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            timeoutId = setTimeout(() => {
                logout();
                console.log('Sesión cerrada por inactividad');
                const navigate = useNavigate();
                navigate('/login');
            }, inactivityTimeout);
        };

        const handleActivity = () => {
            resetTimeout();
        };

        window.addEventListener('mousemove', handleActivity);
        window.addEventListener('keydown', handleActivity);

        return () => {
            unsubscribe();
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('keydown', handleActivity);
            resetTimeout();
        };
    }, [userTimeOut]);

    const logout = async () => {
        try {
            const auth = getAuth();
            await signOut(auth);
            setCurrentUser(null);
        } catch (error) {
            console.error('Error durante el cierre de sesión:', error);
        }
    };

    const setAuthTimeout = (timeout) => {
        setUserTimeOut(timeout);
    };

    const value = {
        currentUser,
        logout,
        userTimeOut,
        setAuthTimeout,
    };

    return (
        <AuthContext.Provider value={value}>
            {currentUser !== undefined && children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
