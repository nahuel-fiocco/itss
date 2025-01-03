import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const auth = getAuth();
        console.log("useAuth devuelte:", auth)
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            console.log("Usuario autenticado detectado:", user);
            setCurrentUser(user || null);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    const logout = async () => {
        try {
            const auth = getAuth();
            await signOut(auth);
            setCurrentUser(null);
        } catch (error) {
            console.error('Error durante el cierre de sesión:', error);
        }
    };

    const value = {
        currentUser,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {currentUser === undefined ? null : children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
