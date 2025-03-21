import React, { useState } from 'react';
import { Form, Button } from 'react-bootstrap';

const UserForm = ({ onCreate, onClose, isEdit, initialData }) => {
    const [userData, setUserData] = useState(initialData || {
        email: '',
        name: '',
        surname: '',
        role: '',
        password: '',
    });

    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setUserData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const validate = () => {
        const newErrors = {};
        if (!userData.email) newErrors.email = 'El email es requerido';
        if (!userData.name) newErrors.name = 'El nombre es requerido';
        if (!userData.surname) newErrors.surname = 'El apellido es requerido';
        if (!userData.role) newErrors.role = 'El rol es requerido';
        if (!userData.password) newErrors.password = 'La contraseña es requerida';
        return newErrors;
    };

    const handleSave = async () => {
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
        } else {
            setIsLoading(true);
            const userDataToSave = {
                ...userData,
                role: userData.role.toLowerCase(), // Transformar el rol a minúsculas
            };
            await onCreate(userDataToSave);
            setIsLoading(false);
            setUserData({
                email: '',
                name: '',
                surname: '',
                role: '',
                password: '',
            });
            onClose();
        }
    };

    const handleCancel = () => {
        onClose();
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
                    isInvalid={!!errors.email}
                />
                <Form.Control.Feedback type="invalid">
                    {errors.email}
                </Form.Control.Feedback>
            </Form.Group>
            <Form.Group>
                <Form.Label>Nombre</Form.Label>
                <Form.Control
                    type="text"
                    name="name"
                    value={userData.name}
                    onChange={handleChange}
                    placeholder="Nombre"
                    isInvalid={!!errors.name}
                />
                <Form.Control.Feedback type="invalid">
                    {errors.name}
                </Form.Control.Feedback>
            </Form.Group>
            <Form.Group>
                <Form.Label>Apellido</Form.Label>
                <Form.Control
                    type="text"
                    name="surname"
                    value={userData.surname}
                    onChange={handleChange}
                    placeholder="Apellido"
                    isInvalid={!!errors.surname}
                />
                <Form.Control.Feedback type="invalid">
                    {errors.surname}
                </Form.Control.Feedback>
            </Form.Group>
            <Form.Group>
                <Form.Label>Rol</Form.Label>
                <Form.Control
                    as="select"
                    name="role"
                    value={userData.role}
                    onChange={handleChange}
                    isInvalid={!!errors.role}
                >
                    <option value="">Seleccione un rol</option>
                    <option value="Tecnico">Tecnico</option>
                    <option value="Administrador">Administrador</option>
                    <option value="Auditor">Auditor</option>
                </Form.Control>
                <Form.Control.Feedback type="invalid">
                    {errors.role}
                </Form.Control.Feedback>
            </Form.Group>
            <Form.Group>
                <Form.Label>Contraseña</Form.Label>
                <Form.Control
                    type="password"
                    name="password"
                    value={userData.password}
                    onChange={handleChange}
                    placeholder="Contraseña"
                    isInvalid={!!errors.password}
                />
                <Form.Control.Feedback type="invalid">
                    {errors.password}
                </Form.Control.Feedback>
            </Form.Group>

            <Button variant="primary" onClick={handleSave} disabled={isLoading}>
                {isLoading ? 'Creando usuario...' : isEdit ? 'Actualizar Usuario' : 'Crear Usuario'}
            </Button>
            <Button variant="secondary" onClick={handleCancel} disabled={isLoading}>
                Cancelar
            </Button>
        </Form>
    );
};

export default UserForm;
