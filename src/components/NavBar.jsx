import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPowerOff } from '@fortawesome/free-solid-svg-icons';
import '../estilos/NavBar.css';

function Navbar() {
    const navigate = useNavigate();
    const { currentUser, logout } = useAuth();
    const [isRedirected, setIsRedirected] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    useEffect(() => {
        const handleUrlChange = () => {
            setIsRedirected(true);
        };
    }, [navigate]);


    return (
        <div className="navbar-container text-light">
            <h3>IT Smart Solutions</h3>
            {currentUser && (isRedirected || navigate !== undefined) && (
                <button className="logout-button" onClick={handleLogout}>
                    <FontAwesomeIcon icon={faPowerOff} />
                </button>
            )}
        </div>
    );
}

export default Navbar;
