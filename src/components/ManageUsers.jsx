import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHouse } from "@fortawesome/free-solid-svg-icons";
import { Table, Dropdown, DropdownButton } from "react-bootstrap";
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { auth } from "firebase/auth";
import "../estilos/ManageUsers.css";

const ManageUsers = ({ onRegresar }) => {
    const [users, setUsers] = useState([]);
    const [expanded, setExpanded] = useState(null);

    const toggleAcordeon = (userId) => {
        setExpanded((prevExpanded) => (prevExpanded === userId ? null : userId));
    };

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

    useEffect(() => {
        getUsersFromFirestore();
    }, []);

    const resetPassword = async (userId) => {
        try {
            await auth.sendPasswordResetEmail(users.find(user => user.id === userId).email);
            console.log(`Email de reestablecimiento de contraseña enviado para el usuario con ID: ${userId}`);
        } catch (error) {
            console.error('Error al enviar el email de reestablecimiento de contraseña:', error.message);
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

    const editUser = async (userId) => {
        try {
            // Aquí debes implementar la lógica de edición del usuario según tus necesidades
            console.log(`Editar datos del usuario con ID: ${userId}`);
        } catch (error) {
            console.error('Error al actualizar los datos del usuario:', error.message);
        }
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
                                    {user.email}
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
                                                <Dropdown.Item onClick={() => handleDropdownAction("resetPassword", user.id)}>
                                                    Reestablecer Contraseña
                                                </Dropdown.Item>
                                                <Dropdown.Item onClick={() => handleDropdownAction("disableAccount", user.id)}>
                                                    Deshabilitar Cuenta
                                                </Dropdown.Item>
                                                <Dropdown.Item onClick={() => handleDropdownAction("deleteAccount", user.id)}>
                                                    Eliminar Cuenta
                                                </Dropdown.Item>
                                                <Dropdown.Item onClick={() => handleDropdownAction("editUser", user.id)}>
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
                                        <Dropdown.Item onClick={() => handleDropdownAction("resetPassword", user.id)}>
                                            Reestablecer Contraseña
                                        </Dropdown.Item>
                                        <Dropdown.Item onClick={() => handleDropdownAction("disableAccount", user.id)}>
                                            Deshabilitar Cuenta
                                        </Dropdown.Item>
                                        <Dropdown.Item onClick={() => handleDropdownAction("deleteAccount", user.id)}>
                                            Eliminar Cuenta
                                        </Dropdown.Item>
                                        <Dropdown.Item onClick={() => handleDropdownAction("editUser", user.id)}>
                                            Editar Usuario
                                        </Dropdown.Item>
                                    </DropdownButton>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}

            <button onClick={onRegresar}>
                <FontAwesomeIcon icon={faHouse} />
                Volver al inicio
            </button>
        </div>
    );
};

export default ManageUsers;
