import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHouse, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { Table, Dropdown, DropdownButton, Modal, Button } from 'react-bootstrap';
import { getDocs, collection, doc, updateDoc, addDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import '../estilos/ManageUsers.css';
import PasswordResetForm from './PasswordResetForm.jsx';
import UserForm from './UserForm.jsx';

const ManageUsers = ({ onRegresar }) => {
    const [users, setUsers] = useState([]);
    const [expanded, setExpanded] = useState(null);
    const [resetPasswordUserId, setResetPasswordUserId] = useState(null);
    const [showPasswordResetForm, setShowPasswordResetForm] = useState(false);
    const [showUserForm, setShowUserForm] = useState(false);
    const [creatingUser, setCreatingUser] = useState(false);

    const fetchUsers = async () => {
        try {
            const usersCollection = collection(db, 'users');
            const usersSnapshot = await getDocs(usersCollection);
            let usersData = usersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            usersData = sortUsersBySurname(usersData); // Ordenar antes de establecer el estado
            setUsers(usersData);
        } catch (error) {
            console.error('Error al obtener los usuarios:', error.message);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        setUsers((prevUsers) => sortUsersBySurname(prevUsers));
    }, [users]);

    const sortUsersBySurname = (users) => {
        return users.sort((a, b) => {
            if (a.disabled && !b.disabled) return 1;
            if (!a.disabled && b.disabled) return -1;
            return a.surname.localeCompare(b.surname);
        });
    };

    const resetPassword = async (userId, newPassword) => {
        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, { password: newPassword });
        } catch (error) {
            console.error('Error al restablecer la contraseña:', error.message);
        }
    };

    const handleResetPassword = (userId, newPassword) => {
        resetPassword(userId, newPassword);
    };

    const disableAccount = async (userId) => {
        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, { disabled: true });
        } catch (error) {
            console.error('Error al deshabilitar la cuenta:', error.message);
        }
    };

    const enableAccount = async (userId) => {
        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, { disabled: false });
        } catch (error) {
            console.error('Error al reactivar la cuenta:', error.message);
        }
    };

    const handleCreateUser = async (newUserData) => {
        try {
            setCreatingUser(true);
            const { email, name, surname, role, password } = newUserData;
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            await addDoc(collection(db, 'users'), {
                email,
                name,
                surname,
                role,
                disabled: false,
            });
            fetchUsers();
        } catch (error) {
            console.error('Error al crear el usuario:', error.message);
        } finally {
            setCreatingUser(false);
        }
    };

    const toggleAcordeon = (userId) => {
        setExpanded((prevExpanded) => (prevExpanded === userId ? null : userId));
    };

    const isMobile = window.innerWidth <= 768;

    const activeUsers = users.filter(user => !user.disabled);
    const inactiveUsers = users.filter(user => user.disabled);

    const handleDisableAccount = async (userId) => {
        await disableAccount(userId);
        fetchUsers();
    };

    const handleEnableAccount = async (userId) => {
        await enableAccount(userId);
        fetchUsers();
    };

    return (
        <div className='manage-users-container'>
            {isMobile ? (
                <>
                    <h2>Usuarios activos: {activeUsers.length}</h2>
                    <div className='accordion' id='activeUsersAcordeon'>
                        {activeUsers.map((user) => (
                            <div className='accordion-item bg-dark text-light' key={user.id}>
                                <h2 className='accordion-header' id={`userHeading${user.id}`}>
                                    <button className='accordion-button bg-dark text-light' type='button' data-bs-toggle='collapse' data-bs-target={`#userCollapse${user.id}`} aria-expanded='false' aria-controls={`userCollapse${user.id}`} onClick={() => toggleAcordeon(user.id)}>
                                        {`${user.surname}, ${user.name}`}
                                    </button>
                                </h2>
                                <div id={`userCollapse${user.id}`} className={`accordion-collapse collapse ${expanded === user.id ? 'show' : ''}`} aria-labelledby={`userHeading${user.id}`} data-bs-parent='#activeUsersAcordeon'>
                                    <div className='accordion-body'>
                                        <p><strong>ID:</strong> {user.id}</p>
                                        <p><strong>Email:</strong> {user.email}</p>
                                        <p><strong>Nombre:</strong> {user.name}</p>
                                        <p><strong>Apellido:</strong> {user.surname}</p>
                                        <p><strong>Rol:</strong> {user.role}</p>
                                        <div className='contenedorDropdownMobile'>
                                            <DropdownButton variant={'secondary'} title={'Acciones'}>
                                                <Dropdown.Item onClick={() => { setResetPasswordUserId(user.id); setShowPasswordResetForm(true); }}>
                                                    Reestablecer Contraseña
                                                </Dropdown.Item>
                                                <Dropdown.Item onClick={() => handleDisableAccount(user.id)}>
                                                    Deshabilitar cuenta
                                                </Dropdown.Item>
                                            </DropdownButton>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {inactiveUsers.length > 0 && (
                        <>
                            <h2>Usuarios inactivos: {inactiveUsers.length}</h2>
                            <div className='accordion' id='inactiveUsersAcordeon'>
                                {inactiveUsers.map((user) => (
                                    <div className='accordion-item bg-dark text-light disabled' key={user.id}>
                                        <h2 className='accordion-header' id={`userHeading${user.id}`}>
                                            <button className='accordion-button bg-dark text-light' type='button' data-bs-toggle='collapse' data-bs-target={`#userCollapse${user.id}`} aria-expanded='false' aria-controls={`userCollapse${user.id}`} onClick={() => toggleAcordeon(user.id)}>
                                                {`${user.surname}, ${user.name}`}
                                            </button>
                                        </h2>
                                        <div id={`userCollapse${user.id}`} className={`accordion-collapse collapse ${expanded === user.id ? 'show' : ''}`} aria-labelledby={`userHeading${user.id}`} data-bs-parent='#inactiveUsersAcordeon'>
                                            <div className='accordion-body'>
                                                <p><strong>ID:</strong> {user.id}</p>
                                                <p><strong>Email:</strong> {user.email}</p>
                                                <p><strong>Nombre:</strong> {user.name}</p>
                                                <p><strong>Apellido:</strong> {user.surname}</p>
                                                <p><strong>Rol:</strong> {user.role}</p>
                                                <div className='contenedorDropdownMobile'>
                                                    <DropdownButton variant={'secondary'} title={'Acciones'}>
                                                        <Dropdown.Item onClick={() => { setResetPasswordUserId(user.id); setShowPasswordResetForm(true); }}>
                                                            Reestablecer Contraseña
                                                        </Dropdown.Item>
                                                        <Dropdown.Item onClick={() => handleEnableAccount(user.id)}>
                                                            Reactivar cuenta
                                                        </Dropdown.Item>
                                                    </DropdownButton>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </>
            ) : (
                <>
                    <h2>Usuarios activos: {activeUsers.length}</h2>
                    <Table striped bordered hover variant='dark' responsive>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Email</th>
                                <th>Nombre</th>
                                <th>Apellido</th>
                                <th>Rol</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activeUsers.map((user) => (
                                <tr key={user.id}>
                                    <td>{user.id}</td>
                                    <td>{user.email}</td>
                                    <td>{user.name}</td>
                                    <td>{user.surname}</td>
                                    <td>{user.role}</td>
                                    <td className='text-center'>
                                        <DropdownButton title={''} variant='secondary'>
                                            <Dropdown.Item onClick={() => { setResetPasswordUserId(user.id); setShowPasswordResetForm(true); }}>
                                                Reestablecer Contraseña
                                            </Dropdown.Item>
                                            <Dropdown.Item onClick={() => handleDisableAccount(user.id)}>
                                                Deshabilitar Cuenta
                                            </Dropdown.Item>
                                        </DropdownButton>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>

                    {inactiveUsers.length > 0 && (
                        <>
                            <h2>Usuarios inactivos: {inactiveUsers.length}</h2>
                            <Table striped bordered hover variant='dark' responsive>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Email</th>
                                        <th>Nombre</th>
                                        <th>Apellido</th>
                                        <th>Rol</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {inactiveUsers.map((user) => (
                                        <tr key={user.id} className='disabled'>
                                            <td>{user.id}</td>
                                            <td>{user.email}</td>
                                            <td>{user.name}</td>
                                            <td>{user.surname}</td>
                                            <td>{user.role}</td>
                                            <td className='text-center'>
                                                <DropdownButton title={''} variant='secondary'>
                                                    <Dropdown.Item onClick={() => { setResetPasswordUserId(user.id); setShowPasswordResetForm(true); }}>
                                                        Reestablecer Contraseña
                                                    </Dropdown.Item>
                                                    <Dropdown.Item onClick={() => handleEnableAccount(user.id)}>
                                                        Reactivar Cuenta
                                                    </Dropdown.Item>
                                                </DropdownButton>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </>
                    )}
                </>
            )}
            <div className='contenedor-botones-usuarios'>
                <button onClick={onRegresar}>
                    <FontAwesomeIcon icon={faHouse} />
                    Inicio
                </button>
                <button onClick={() => setShowUserForm(true)}>
                    <FontAwesomeIcon icon={faUserPlus} />
                    Crear Usuario
                </button>
            </div>
            {showPasswordResetForm && (
                <PasswordResetForm
                    userId={resetPasswordUserId}
                    onReset={handleResetPassword}
                    onClose={() => setShowPasswordResetForm(false)}
                />
            )}
            <Modal show={showUserForm} onHide={() => setShowUserForm(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Crear Usuario</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <UserForm onCreate={handleCreateUser} onClose={() => setShowUserForm(false)} />
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default ManageUsers;
