// PasswordResetForm.jsx
import React, { useState } from "react";
import { Form, Button } from "react-bootstrap";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const PasswordResetForm = ({ userId, onReset, onClose }) => {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");

    const toggleShowPassword = () => {
        setShowPassword(!showPassword);
    };

    const handlePasswordChange = (e) => {
        setNewPassword(e.target.value);
    };

    const handleReset = () => {
        if (newPassword !== confirmPassword) {
            setError("Las contraseñas no coinciden");
            return;
        }
        if (onReset) {
            onReset(userId, newPassword);
        }
    };

    return (
        <Form>
            <Form.Group className="mb-3">
                <Form.Label>Nueva Contraseña</Form.Label>
                <div style={{ position: "relative" }}>
                    <Form.Control
                        type={showPassword ? "text" : "password"}
                        placeholder="Nueva Contraseña"
                        value={newPassword}
                        onChange={handlePasswordChange}
                    />
                    <div
                        onClick={toggleShowPassword}
                        style={{
                            position: "absolute",
                            top: "50%",
                            right: "10px",
                            transform: "translateY(-50%)",
                            cursor: "pointer",
                        }}
                    >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </div>
                </div>
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Label>Confirmar Contraseña</Form.Label>
                <div style={{ position: "relative" }}>
                    <Form.Control
                        type={showPassword ? "text" : "password"}
                        placeholder="Confirmar Contraseña"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                </div>
            </Form.Group>

            {error && <p style={{ color: "red" }}>{error}</p>}

            <Button variant="primary" onClick={handleReset}>
                Resetear Contraseña
            </Button>{" "}

            <Button variant="secondary" onClick={onClose}>
                Cancelar
            </Button>

        </Form>
    );
};

export default PasswordResetForm;
