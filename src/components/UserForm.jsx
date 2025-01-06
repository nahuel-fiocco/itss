import React, { useState, useEffect } from 'react';
import { Form, Button } from 'react-bootstrap';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const UserForm = ({ onSave, onCancel, isEdit, userId }) => {
    const [userData, setUserData] = useState({
        email: '',
        name: '',
        surname: '',
        role: '',
        password: '',
    });

    useEffect(() => {
        if (isEdit) {
            const fetchUserData = async () => {
                const userDocRef = doc(db, 'users', userId);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    setUserData(userDoc.data());
                }
            };
            fetchUserData();
        }
    }, [isEdit, userId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setUserData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        const { email, name, surname, role, password } = userData;
        if (!email || !name || !role || !password) {
            alert('Por favor completa todos los campos obligatorios.');
            return;
        }

        onSave(userData);
    };

    return (
        <Form>
            <Form.Group>
                <Form.Label>Email</Form.Label>
                <Form.Control
                    type="email"
                    name="email"
                    value={userData.email}
                    onChange={handleChange}
                    placeholder="Email"
                />
            </Form.Group>
            <Form.Group>
                <Form.Label>Nombre</Form.Label>
                <Form.Control
                    type="text"
                    name="name"
                    value={userData.name}
                    onChange={handleChange}
                    placeholder="Nombre"
                />
            </Form.Group>
            <Form.Group>
                <Form.Label>Apellido</Form.Label>
                <Form.Control
                    type="text"
                    name="surname"
                    value={userData.surname}
                    onChange={handleChange}
                    placeholder="Apellido"
                />
            </Form.Group>
            <Form.Group>
                <Form.Label>Rol</Form.Label>
                <Form.Control
                    as="select"
                    name="role"
                    value={userData.role}
                    onChange={handleChange}
                >
                    <option value="">Seleccionar Rol</option>
                    <option value="Tecnico">Tecnico</option>
                    <option value="Administrador">Administrador</option>
                    <option value="Auditor">Auditor</option>
                </Form.Control>
            </Form.Group>
            <Form.Group>
                <Form.Label>Contraseña</Form.Label>
                <Form.Control
                    type="password"
                    name="password"
                    value={userData.password}
                    onChange={handleChange}
                    placeholder="Contraseña"
                />
            </Form.Group>

            <Button variant="primary" onClick={handleSave}>
                {isEdit ? 'Actualizar Usuario' : 'Crear Usuario'}
            </Button>
            <Button variant="secondary" onClick={onCancel}>
                Cancelar
            </Button>
        </Form>
    );
};

export default UserForm;
