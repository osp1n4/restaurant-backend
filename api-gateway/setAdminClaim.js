// Script para asignar el custom claim 'role: ADMIN' a un usuario en Firebase Authentication
// Ejecutar con Node.js en el backend o localmente (no en el frontend)

const admin = require("firebase-admin");

const serviceAccount = require("./serviceAccountKey.json"); // Ajusta la ruta si es necesario

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Cambia este UID por el del usuario al que quieres asignar el rol ADMIN
const uid = "UID_DEL_USUARIO";

admin.auth().setCustomUserClaims(uid, { role: "ADMIN" })
  .then(() => {
    console.log(`Custom claim 'ADMIN' asignado al usuario ${uid}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error asignando custom claim:", error);
    process.exit(1);
  });
