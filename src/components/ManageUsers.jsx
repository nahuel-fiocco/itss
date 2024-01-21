import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHouse } from "@fortawesome/free-solid-svg-icons";
import "../estilos/ManageUsers.css";

const ManageUsers = ({ onRegresar }) => {
    return (
        <div className="manage-users-container">
            {window.innerWidth > 768 ? <h3>Administrar usuarios</h3> : <h5>Administrar usuarios</h5>}
            <button onClick={onRegresar}>
                <FontAwesomeIcon icon={faHouse} />
                Volver al inicio
            </button>
        </div>
    );
};

export default ManageUsers;