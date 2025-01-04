import React, { useState } from "react";
import { Form, Button } from "react-bootstrap";

const UserForm = ({ user, onSave, onCancel }) => {
    const [userData, setUserData] = useState({
        email: user?.email || "",
        name: user?.name || "",
        surname: user?.surname || "",
        role: user?.role || "",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setUserData((prevUserData) => ({
            ...prevUserData,
            [name]: value,
        }));
    };

    const handleSave = () => {
        if (!userData.email || !userData.name || !userData.role) {
            alert('Por favor completa todos los campos obligatorios.');
            return;
        }
        onSave(userData);
    };

    const handleCancel = () => {
        setUserData(user);
        onCancel();
    };

    return (
        <Form>
            <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                    type="email"
                    placeholder="Email"
                    name="email"
                    value={userData.email}
                    onChange={handleChange}
                />
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Label>Nombre</Form.Label>
                <Form.Control
                    type="text"
                    placeholder="Nombre"
                    name="name"
                    value={userData.name}
                    onChange={handleChange}
                />
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Label>Apellido</Form.Label>
                <Form.Control
                    type="text"
                    placeholder="Apellido"
                    name="surname"
                    value={userData.surname}
                    onChange={handleChange}
                />
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Label>Rol</Form.Label>
                <Form.Control
                    type="text"
                    placeholder="Rol"
                    name="role"
                    value={userData.role}
                    onChange={handleChange}
                />
            </Form.Group>

            <Button variant="primary" onClick={handleSave}>
                Guardar Cambios
            </Button>{" "}
            <Button variant="secondary" onClick={handleCancel}>
                Cancelar
            </Button>
        </Form>
    );
};

export default UserForm;
