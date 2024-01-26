import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPowerOff, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import '../estilos/NavBar.css';

import logo from '../assets/itss-logo.png';
import { collection, getFirestore, doc, getDoc } from 'firebase/firestore';

function Navbar() {
    const navigate = useNavigate();
    const { currentUser, logout } = useAuth();
    const [isRedirected, setIsRedirected] = useState(false);
    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [rol, setRol] = useState('');
    const [loading, setLoading] = useState(true);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const handleUrlChange = () => {
        setIsRedirected(true);
    };

    useEffect(() => {
        const fetchData = async () => {
            try {

                if (!currentUser) {
                    return;
                }

                const db = getFirestore();
                const userDoc = doc(collection(db, 'users'), currentUser.uid);
                const userSnapshot = await getDoc(userDoc);

                if (userSnapshot.exists()) {
                    const userData = userSnapshot.data();
                    setNombre(userData.name);
                    setApellido(userData.surname);
                    setRol(userData.role);
                    setLoading(false);
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };

        fetchData();
    }, [currentUser]);

    return (
        <div className="navbar-container text-light">
            <img src={logo} alt="ITSS Logo" className='rounded' width={270} />
            <p className='text-dark'>Aplicacion en desarrollo</p>
            {loading ||
                currentUser && (isRedirected || navigate !== undefined) && (
                    <div className="navbar-username">
                        <div className='nombre-y-rol'>
                            <p className='text-black'>{apellido}, {nombre} | {rol[0].toUpperCase() + rol.slice(1)}</p>
                        </div>
                        <button className="logout-button" onClick={handleLogout}>
                            <FontAwesomeIcon icon={faPowerOff} style={{ color: "#000000" }} />
                        </button>
                    </div>
                )
            }
        </div>
    );
}

export default Navbar;
