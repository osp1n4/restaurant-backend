require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const fs = require('fs');

const app = express();
app.use(bodyParser.json());

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.SERVICE_ACCOUNT_PATH) {
  console.error('Set SERVICE_ACCOUNT_PATH or GOOGLE_APPLICATION_CREDENTIALS env var pointing to the service account JSON file.');
  process.exit(1);
}

const serviceAccountPath = process.env.SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS;

// Verificar que el path sea un archivo y no un directorio
if (!fs.existsSync(serviceAccountPath)) {
  console.error(`Service account file not found: ${serviceAccountPath}`);
  process.exit(1);
}

const stats = fs.statSync(serviceAccountPath);
if (stats.isDirectory()) {
  console.error(`SERVICE_ACCOUNT_PATH is a directory, not a file: ${serviceAccountPath}`);
  console.error('Expected path to serviceAccountKey.json file');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Middleware simple para autenticar con una API key (evitar exposición pública)
const API_KEY = process.env.API_KEY || 'dev-key';
app.use((req, res, next) => {
  const key = req.header('x-api-key') || req.query.apiKey;
  if (!key || key !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

app.post('/set-role/:uid', async (req, res) => {
  const { uid } = req.params;
  const { role, adminClaim } = req.body;
  try {
    const claims = {};
    if (role) claims.role = String(role).toUpperCase();
    if (adminClaim !== undefined) claims.admin = !!adminClaim;

    await admin.auth().setCustomUserClaims(uid, claims);
    return res.json({ ok: true, uid, claims });
  } catch (err) {
    console.error('Error setting claims', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// Endpoint para crear usuario con rol
app.post('/create-user', async (req, res) => {
  try {
    const { email, password, displayName, role } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ ok: false, error: 'Email and password are required' });
    }

    // Crear usuario en Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: displayName || email.split('@')[0],
      emailVerified: false
    });

    // Asignar rol por defecto 'KITCHEN' si no se especifica
    const userRole = role ? String(role).toUpperCase() : 'KITCHEN';
    await admin.auth().setCustomUserClaims(userRecord.uid, { 
      role: userRole,
      admin: userRole === 'ADMIN'
    });

    return res.json({ 
      ok: true, 
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        role: userRole
      }
    });
  } catch (err) {
    console.error('Error creating user', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// Endpoint para actualizar usuario (displayName y rol)
app.put('/update-user/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const { displayName, role } = req.body;
    
    if (!uid) {
      return res.status(400).json({ ok: false, error: 'UID is required' });
    }

    // Actualizar displayName si se proporciona
    if (displayName) {
      await admin.auth().updateUser(uid, { displayName });
    }

    // Actualizar rol si se proporciona
    if (role) {
      const userRole = String(role).toUpperCase();
      // Validar roles permitidos
      const validRoles = ['ADMIN', 'KITCHEN', 'WAITER'];
      if (!validRoles.includes(userRole)) {
        return res.status(400).json({ ok: false, error: `Invalid role. Allowed: ${validRoles.join(', ')}` });
      }
      
      await admin.auth().setCustomUserClaims(uid, { 
        role: userRole,
        admin: userRole === 'ADMIN'
      });
    }

    // Obtener usuario actualizado
    const updatedUser = await admin.auth().getUser(uid);

    return res.json({ 
      ok: true, 
      user: {
        uid: updatedUser.uid,
        email: updatedUser.email,
        displayName: updatedUser.displayName,
        role: updatedUser.customClaims?.role || 'KITCHEN'
      }
    });
  } catch (err) {
    console.error('Error updating user', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// Endpoint para listar usuarios (sólo accesible con API_KEY)
app.get('/list-users', async (req, res) => {
  try {
    const maxResults = parseInt(req.query.maxResults) || 1000;
    const list = [];
    // paginar con listUsers
    let result = await admin.auth().listUsers(1000);
    result.users.forEach(u => list.push(u.toJSON()));
    while (result.pageToken) {
      result = await admin.auth().listUsers(1000, result.pageToken);
      result.users.forEach(u => list.push(u.toJSON()));
      if (list.length >= maxResults) break;
    }
    return res.json({ ok: true, users: list.slice(0, maxResults) });
  } catch (err) {
    console.error('Error listing users', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// Endpoint para desactivar un usuario (US-019)
app.put('/disable-user/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    
    if (!uid) {
      return res.status(400).json({ ok: false, error: 'UID is required' });
    }

    // Desactivar usuario en Firebase Auth
    await admin.auth().updateUser(uid, { disabled: true });

    // Obtener usuario actualizado
    const updatedUser = await admin.auth().getUser(uid);

    return res.json({ 
      ok: true, 
      message: 'Usuario desactivado exitosamente',
      user: {
        uid: updatedUser.uid,
        email: updatedUser.email,
        displayName: updatedUser.displayName,
        disabled: updatedUser.disabled
      }
    });
  } catch (err) {
    console.error('Error disabling user', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// Endpoint para activar un usuario (US-019)
app.put('/enable-user/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    
    if (!uid) {
      return res.status(400).json({ ok: false, error: 'UID is required' });
    }

    // Activar usuario en Firebase Auth
    await admin.auth().updateUser(uid, { disabled: false });

    // Obtener usuario actualizado
    const updatedUser = await admin.auth().getUser(uid);

    return res.json({ 
      ok: true, 
      message: 'Usuario activado exitosamente',
      user: {
        uid: updatedUser.uid,
        email: updatedUser.email,
        displayName: updatedUser.displayName,
        disabled: updatedUser.disabled
      }
    });
  } catch (err) {
    console.error('Error enabling user', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

const port = process.env.PORT || 4001;
app.listen(port, () => console.log(`Firebase Admin API listening on ${port}`));
