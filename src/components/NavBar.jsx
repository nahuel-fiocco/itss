import React, { useState, useRef, useEffect } from 'react';
import { useDarkMode } from '../context/DarkModeContext';
import { useAuth } from '../context/AuthContext';
import '../estilos/Main.css';

function Navbar() {
    const { setAuthTimeout } = useAuth();
    const { darkMode, toggleDarkMode } = useDarkMode();
    const [timeoutValue, setTimeoutValue] = useState(15);
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    const toggleMenu = () => {
        setMenuOpen((prevOpen) => !prevOpen);
    };

    const handleClickOutside = (event) => {
        if (menuRef.current && !menuRef.current.contains(event.target)) {
            setMenuOpen(false);
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleTimeoutChange = (event) => {
        const newValue = parseInt(event.target.value, 10);
        setTimeoutValue(newValue);
        setAuthTimeout(newValue);
    };

    return (
        <div className={`navbar ${darkMode ? 'dark' : ''}`}>
            <h3>IT Smart Solutions</h3>
            <div className="menu-container" ref={menuRef}>
                <button className="menu-button" onClick={toggleMenu}>
                    {menuOpen ? '🔼' : '🔽'}
                </button>
                {menuOpen && (
                    <div className="menu-dropdown">
                        <div className="menu-content">
                            <label htmlFor="timeout">Timeout (min):</label>
                            <select id="timeout" value={timeoutValue} onChange={handleTimeoutChange}>
                                <option value={15}>15</option>
                                <option value={30}>30</option>
                                <option value={45}>45</option>
                                <option value={60}>60</option>
                            </select>
                            <button onClick={toggleDarkMode}>
                                {darkMode ? '☀️' : '🌙'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Navbar;
