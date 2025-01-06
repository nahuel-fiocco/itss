// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";  // Importa getAuth para autentificación
import { getFirestore } from "firebase/firestore";  // Importa Firestore

const firebaseConfig = {
    apiKey: "AIzaSyCqM_HBfuxkvh43xgi65cuuRpeq-BaGGao",
    authDomain: "itss-ab511.firebaseapp.com",
    projectId: "itss-ab511",
    storageBucket: "itss-ab511.appspot.com",
    messagingSenderId: "349843522587",
    appId: "1:349843522587:web:a3064a9f3839bc3396e4be"
};

// Inicializa la app de Firebase
const app = initializeApp(firebaseConfig);

// Obtiene las instancias de Firebase Auth y Firestore
const auth = getAuth(app);
const db = getFirestore(app);

// Exporta auth y db para que puedas usarlos en otros archivos
export { auth, db };

// Exporta la app por defecto (opcional si lo necesitas en algún lugar)
export default app;
