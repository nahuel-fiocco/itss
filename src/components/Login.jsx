import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, doc, getDoc } from 'firebase/firestore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import '../estilos/Login.css';

function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleAuthentication = (role) => {
        switch (role) {
            case 'administrador':
                navigate('/admin');
                break;
            case 'tecnico':
                navigate('/tecnico');
                break;
            case 'auditor':
                navigate('/auditor');
                break;
            default:
                navigate('/login');
        }
    };

    const checkUserRole = async (uid) => {
        try {
            const db = getFirestore();
            const userRef = doc(collection(db, 'users'), uid);
            const userSnapshot = await getDoc(userRef);

            if (userSnapshot.exists()) {
                const userData = userSnapshot.data();
                return userData ? userData.role : null;
            }

            return null;
        } catch (error) {
            console.error('Error fetching user role:', error);
            return null;
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            setLoading(true);
            const auth = getAuth();
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const uid = userCredential.user.uid;
            const role = await checkUserRole(uid);
            handleAuthentication(role);
            setEmail('');
            setPassword('');
        } catch (error) {
            console.error('Error al iniciar sesión:', error.message);
            setError('Credenciales incorrectas. Por favor, inténtalo de nuevo.');
            setEmail('');
            setPassword('');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = () => {
        navigate('/forgotpassword');
    };

    return (
        <div className="login-container bg-dark text-light">
            <h1>Login</h1>
            {error && <p className="error-message">{error}</p>}
            <form className='form-login' onSubmit={handleSubmit}>
                <div className="email-container">
                    <label htmlFor='email'>Email</label>
                    <input type="email" name="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="on" />
                </div>
                <div className="password-container">
                    <label htmlFor='password'>Contraseña</label>
                    <div className="password-input-container">
                        <input type={showPassword ? 'text' : 'password'} name="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        <button type="button" className="toggle-password-button" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <FontAwesomeIcon className='ojito' icon={faEye} /> : <FontAwesomeIcon className='ojito' icon={faEyeSlash} />}
                        </button>
                    </div>
                </div>
                <div className="buttons-container">
                    <button type="submit" disabled={loading}>
                        {loading ? <FontAwesomeIcon icon={faSpinner} spin style={{ marginRight: '5px' }} /> : null}
                        Login
                    </button>
                    <button type="button" onClick={handleForgotPassword}>
                        Olvidé mi contraseña
                    </button>
                </div>
            </form>
        </div>
    );
}

export default Login;
