// PasswordResetForm.jsx
import React, { useState } from "react";
import { Form, Button } from "react-bootstrap";

const PasswordResetForm = ({ onReset, onCancel }) => {
    const [newPassword, setNewPassword] = useState("");

    const handlePasswordChange = (e) => {
        setNewPassword(e.target.value);
    };

    const handleReset = () => {
        onReset(newPassword);
    };

    return (
        <Form>
            <Form.Group className="mb-3">
                <Form.Label>Nueva Contraseña</Form.Label>
                <Form.Control
                    type="password"
                    placeholder="Nueva Contraseña"
                    value={newPassword}
                    onChange={handlePasswordChange}
                />
            </Form.Group>
            <Button variant="primary" onClick={handleReset}>
                Resetear Contraseña
            </Button>{" "}
            <Button variant="secondary" onClick={onCancel}>
                Cancelar
            </Button>
        </Form>
    );
};

export default PasswordResetForm;
