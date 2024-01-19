// DetalleConformes.jsx
import React from 'react';
import Auditor from './Auditor.jsx';
import { Button } from 'react-bootstrap';
import { IoTrash, IoPencil } from 'react-icons/io5';

const DetalleConformes = ({ setMostrarDetalles }) => {
    // Puedes agregar funcionalidades adicionales o modificar según tus necesidades
    return (
        <div>
            <h2>Detalle de Conformes</h2>
            <Button variant="danger" onClick={() => handleEliminarClick()}>
                <IoTrash />
                Eliminar
            </Button>
            <Button variant="primary" onClick={() => handleEditarClick()}>
                <IoPencil />
                Editar
            </Button>

            <Button variant="secondary" onClick={() => setMostrarDetalles(false)}>
                Volver
            </Button>
        </div>
    );
};

export default DetalleConformes;