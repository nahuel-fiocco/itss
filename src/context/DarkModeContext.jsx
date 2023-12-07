import React, { createContext, useContext, useState, useEffect } from 'react';

const DarkModeContext = createContext();

export function DarkModeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode((prevDarkMode) => !prevDarkMode);
  };

  useEffect(() => {
    console.log('Dark mode:', darkMode ? 'on' : 'off');
  }, [darkMode]);

  const value = {
    darkMode,
    toggleDarkMode: () => {
        setDarkMode((prevDarkMode) => !prevDarkMode);
      },
  };

  return (
    <DarkModeContext.Provider value={value}>
      {children}
    </DarkModeContext.Provider>
  );
}

export function useDarkMode() {
  return useContext(DarkModeContext);
}
