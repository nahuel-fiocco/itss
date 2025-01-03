// En tu archivo functions/index.js

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const sgMail = require('@sendgrid/mail');

admin.initializeApp();

// Desactivar temporalmente la regla max-len para la API key
// eslint-disable-next-line max-len
sgMail.setApiKey('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');

exports.sendEmail = functions.https.onCall(async (data, context) => {
  const {to, subject, text} = data;
  const msg = {to, from: 'info@it-smart.com.ar', subject, text};
  try {
    await sgMail.send(msg);
    return {success: true};
  } catch (error) {
    console.error(error.toString());
    throw new functions.https.HttpsError('internal', 'Correo no enviado');
  }
});
