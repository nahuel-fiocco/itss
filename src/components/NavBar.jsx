// Navbar.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPowerOff } from '@fortawesome/free-solid-svg-icons';
import '../estilos/NavBar.css';

function Navbar() {
    const navigate = useNavigate();
    const { currentUser, logout } = useAuth();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="navbar-container">
            <h3>IT Smart Solutions</h3>
            {currentUser && (
                <button className="logout-button" onClick={handleLogout}>
                    <FontAwesomeIcon icon={faPowerOff} />
                </button>
            )}
        </div>
    );
}

export default Navbar;
