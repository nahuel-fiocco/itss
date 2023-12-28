import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ element, allowedRoles }) => {
    const { currentUser } = useAuth();

    if (!currentUser || !allowedRoles.includes(currentUser.role)) {
        return <Navigate to="/login" />;
    }

    return element;
};

export default ProtectedRoute;
