// Archivo: functions/index.js

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors');

admin.initializeApp();
const corsHandler = cors({origin: true});

exports.getUserCreationDate = functions.https.onRequest((req, res) => {
  // Manejar CORS usando el middleware
  corsHandler(req, res, async () => {
    // Verificar método HTTP
    if (req.method !== 'POST') {
      return res.status(405).json({error: 'Método no permitido'});
    }

    const {uid} = req.body;

    // Validar datos del cuerpo de la solicitud
    if (!uid) {
      return res.status(400).json({error: 'UID no proporcionado'});
    }

    try {
      // Obtener la fecha de creación del usuario
      const userRecord = await admin.auth().getUser(uid);
      return res.status(200).json({
        creationTime: userRecord.metadata.creationTime,
      });
    } catch (error) {
      console.error('Error al obtener la fecha de creación:', error);
      return res.status(500).json({error: 'Error interno del servidor'});
    }
  });
});
