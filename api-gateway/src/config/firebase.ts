import admin from 'firebase-admin';
import path from 'path';

// Inicialización de Firebase Admin SDK
// Reemplaza el path y config según tu entorno y variables de entorno
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || path.join(__dirname, '../../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath),
  });
}

export default admin;
