import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHouse, faUserPlus } from "@fortawesome/free-solid-svg-icons";
import { Table, Dropdown, DropdownButton } from "react-bootstrap";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import "../estilos/ManageUsers.css";
import UserForm from "./UserForm.jsx";
import PasswordResetForm from "./PasswordResetForm.jsx";
import { getFunctions, httpsCallable } from 'firebase/functions';

const ManageUsers = ({ onRegresar }) => {
    const [users, setUsers] = useState([]);
    const [expanded, setExpanded] = useState(null);
    const [editUserId, setEditUserId] = useState(null);
    const [resetPasswordUserId, setResetPasswordUserId] = useState(null);

    const toggleAcordeon = (userId) => {
        setExpanded((prevExpanded) => (prevExpanded === userId ? null : userId));
        fetchCreationDate("UID_DEL_USUARIO");
    };

    const auth = getAuth();

    const getUsersFromFirestore = async () => {
        const db = getFirestore();
        const usersCollection = collection(db, 'users');
        const usersSnapshot = await getDocs(usersCollection);
        const usersData = usersSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        setUsers(usersData);
    };

    const functions = getFunctions();
    const getUserCreationDate = httpsCallable(functions, 'getUserCreationDate');

    const fetchCreationDate = async (userId) => {
        try {
            const result = await getUserCreationDate({ uid: userId });
            console.log('Fecha de creación:', result.data.creationTime);
        } catch (error) {
            console.error('Error al obtener la fecha de creación:', error.message);
        }
    };

    useEffect(() => {
        getUsersFromFirestore();
    }, []);

    const resetPassword = async (userEmail) => {
        try {
            await auth.sendPasswordResetEmail(userEmail);
            console.log(`Email de reestablecimiento de contraseña enviado a: ${userEmail}`);
        } catch (error) {
            console.error('Error al enviar el email:', error.message);
        }
    };

    const disableAccount = async (userId) => {
        try {
            await auth.updateUser(userId, { disabled: true });
            console.log(`Cuenta deshabilitada para el usuario con ID: ${userId}`);
        } catch (error) {
            console.error('Error al deshabilitar la cuenta:', error.message);
        }
    };

    const deleteAccount = async (userId) => {
        try {
            await auth.deleteUser(userId);
            console.log(`Cuenta eliminada para el usuario con ID: ${userId}`);
        } catch (error) {
            console.error('Error al eliminar la cuenta:', error.message);
        }
    };

    const editUser = (userId) => {
        setEditUserId(userId);
    };

    const saveUserChanges = async (updatedUserData) => {
        const db = getFirestore();
        const userRef = collection(db, 'users').doc(editUserId);

        try {
            await userRef.update(updatedUserData);
            console.log('Usuario actualizado');
            setEditUserId(null);
            getUsersFromFirestore(); // Refresca la lista
        } catch (error) {
            console.error('Error al actualizar el usuario:', error.message);
        }
    };

    const cancelEditUser = () => {
        // Cancelar la edición, reseteando el estado de edición
        setEditUserId(null);
    };

    const handleDropdownAction = (action, userId) => {
        switch (action) {
            case "resetPassword":
                resetPassword(userId);
                break;
            case "disableAccount":
                disableAccount(userId);
                break;
            case "deleteAccount":
                deleteAccount(userId);
                break;
            case "editUser":
                editUser(userId);
                break;
            default:
                break;
        }
    };

    const isMobile = window.innerWidth <= 768;

    return (
        <div className="manage-users-container">
            {isMobile ? (
                <div className="accordion" id="usersAcordeon">
                    {users.map((user) => (
                        <div className="accordion-item bg-dark text-light" key={user.id}>
                            <h2 className="accordion-header" id={`userHeading${user.id}`}>
                                <button className="accordion-button bg-dark text-light" type="button" data-bs-toggle="collapse" data-bs-target={`#userCollapse${user.id}`} aria-expanded="false" aria-controls={`userCollapse${user.id}`} onClick={() => toggleAcordeon(user.id)}>
                                    {`${user.name}, ${user.surname}`}
                                </button>
                            </h2>
                            <div id={`userCollapse${user.id}`} className={`accordion-collapse collapse ${expanded === user.id ? 'show' : ''}`} aria-labelledby={`userHeading${user.id}`} data-bs-parent="#usersAcordeon">
                                <div className="accordion-body">
                                    <div className="accordion-body-content">
                                        <p><strong>ID:</strong> {user.id}</p>
                                        <p><strong>Email:</strong> {user.email}</p>
                                        <p><strong>Nombre:</strong> {user.name}</p>
                                        <p><strong>Apellido:</strong> {user.surname}</p>
                                        <p><strong>Rol:</strong> {user.role}</p>
                                        <div className="contenedorDropdownMobile">
                                            <DropdownButton variant={'secondary'} title={'Acciones'}>
                                                <Dropdown.Item onClick={() => setResetPasswordUserId(user.id)}>
                                                    Reestablecer Contraseña
                                                </Dropdown.Item>
                                                <Dropdown.Item onClick={() => handleDropdownAction("disableAccount", user.id)}>
                                                    Deshabilitar Cuenta
                                                </Dropdown.Item>
                                                <Dropdown.Item onClick={() => handleDropdownAction("deleteAccount", user.id)}>
                                                    Eliminar Cuenta
                                                </Dropdown.Item>
                                                <Dropdown.Item onClick={() => editUser(user.id)}>
                                                    Editar Usuario
                                                </Dropdown.Item>
                                            </DropdownButton>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <Table striped bordered hover variant="dark" responsive>
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
                        {users.map((user) => (
                            <tr key={user.id}>
                                <td>{user.id}</td>
                                <td>{user.email}</td>
                                <td>{user.name}</td>
                                <td>{user.surname}</td>
                                <td>{user.role}</td>
                                <td className="text-center">
                                    <DropdownButton title={''} variant="secondary" id={`dropdown-button-${user.id}`}>
                                        <Dropdown.Item onClick={() => setResetPasswordUserId(user.id)}>
                                            Reestablecer Contraseña
                                        </Dropdown.Item>
                                        <Dropdown.Item onClick={() => handleDropdownAction("disableAccount", user.id)}>
                                            Deshabilitar Cuenta
                                        </Dropdown.Item>
                                        <Dropdown.Item onClick={() => handleDropdownAction("deleteAccount", user.id)}>
                                            Eliminar Cuenta
                                        </Dropdown.Item>
                                        <Dropdown.Item onClick={() => editUser(user.id)}>
                                            Editar Usuario
                                        </Dropdown.Item>
                                    </DropdownButton>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}
            <div className="contenedor-botones-usuarios">
                <button onClick={onRegresar}>
                    <FontAwesomeIcon icon={faHouse} />
                    Inicio
                </button>
                <button>
                    <FontAwesomeIcon icon={faUserPlus} />
                    Nuevo usuario
                </button>
                <UserForm onSave={saveUserChanges} onCancel={() => { }} />
            </div>
        </div>
    );
};

export default ManageUsers;
