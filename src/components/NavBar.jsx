import React from 'react';
import { useDarkMode } from '../context/DarkModeContext';
import '../estilos/Navbar.css';

function Navbar() {
    const { darkMode, toggleDarkMode } = useDarkMode();

    return (
        <div className={`navbar ${darkMode ? 'dark' : ''}`}>
            <h3>IT Smart Solutions</h3>
            <button onClick={toggleDarkMode}>
                {darkMode ? '☀️' : '🌙'}
            </button>
        </div>
    );
}

export default Navbar;
