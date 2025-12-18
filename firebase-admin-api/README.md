Firebase Admin API (minimal)

1) Preparación
- Ve a Firebase Console > Project Settings > Service accounts > Generate new private key. Descarga `serviceAccountKey.json` y colócalo en `restaurant-backend/firebase-admin-api/`.
- Copia `.env.example` a `.env` y configura `SERVICE_ACCOUNT_PATH` y `API_KEY`.

2) Instalar dependencias y arrancar
```
cd restaurant-backend/firebase-admin-api
npm install
npm start
```

### Ejecutar con Docker
```bash
cd restaurant-backend
# Definir API key temporalmente (PowerShell)
$Env:ADMIN_API_KEY = "mi-api-key-segura"
docker compose up --build firebase-admin-api
```

3) Asignar roles a usuarios

**Opción A - Scripts PowerShell (Windows - Recomendado):**
```powershell
cd restaurant-backend/firebase-admin-api

# Para asignar rol de ADMIN:
.\set-admin-role.ps1 <UID_DEL_USUARIO>

# Para asignar rol de KITCHEN (Cocinero):
.\set-kitchen-role.ps1 <UID_DEL_USUARIO>
```

**Opción B - Script Node.js (Node CLI):**
```bash
cd restaurant-backend/firebase-admin-api
# Edita .env si necesitas cambiar API_URL/API_KEY
node scripts/set-role.js <UID_DEL_USUARIO> ADMIN true
node scripts/set-role.js <UID_DEL_USUARIO> KITCHEN false
```

4) Alternativa: usar curl
```
curl -X POST http://localhost:4001/set-role/<UID> -H "x-api-key: <API_KEY>" -H "Content-Type: application/json" -d '{"role":"ADMIN","adminClaim":true}'
```

Nota: El endpoint está protegido por una API key simple; en producción debes usar un mecanismo más seguro (VPN/WHITELISTING/Authenticated requests).

5) Crear nuevo usuario con rol (US-015)
```bash
# Crear usuario con rol KITCHEN (por defecto)
curl -X POST http://localhost:4001/create-user \
  -H "x-api-key: <API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@ejemplo.com","password":"password123","displayName":"Nombre Usuario","role":"KITCHEN"}'

# Crear usuario con rol ADMIN
curl -X POST http://localhost:4001/create-user \
  -H "x-api-key: <API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ejemplo.com","password":"password123","displayName":"Admin Usuario","role":"ADMIN"}'
```

6) Actualizar usuario y cambiar rol (US-018)
```bash
# Actualizar displayName y rol de un usuario
curl -X PUT http://localhost:4001/update-user/<UID> \
  -H "x-api-key: <API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"displayName":"Nuevo Nombre","role":"ADMIN"}'

# Solo cambiar rol
curl -X PUT http://localhost:4001/update-user/<UID> \
  -H "x-api-key: <API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"role":"KITCHEN"}'

# Solo cambiar displayName
curl -X PUT http://localhost:4001/update-user/<UID> \
  -H "x-api-key: <API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"displayName":"Juan Pérez"}'
```

7) Listar usuarios
```
GET http://localhost:4001/list-users
Headers:
	x-api-key: <API_KEY>

Respuesta: { ok: true, users: [ ... ] }
```

8) Desactivar usuario (US-019)
```bash
# Desactivar cuenta de usuario
curl -X PUT http://localhost:4001/disable-user/<UID> \
  -H "x-api-key: <API_KEY>" \
  -H "Content-Type: application/json"

# Respuesta exitosa:
# { "ok": true, "message": "Usuario desactivado exitosamente", "user": { "uid": "...", "disabled": true } }
```

9) Activar usuario (US-019)
```bash
# Activar cuenta de usuario previamente desactivada
curl -X PUT http://localhost:4001/enable-user/<UID> \
  -H "x-api-key: <API_KEY>" \
  -H "Content-Type: application/json"

# Respuesta exitosa:
# { "ok": true, "message": "Usuario activado exitosamente", "user": { "uid": "...", "disabled": false } }
```

**Nota sobre desactivación:**
- Los usuarios desactivados NO pueden iniciar sesión en Firebase Auth
- Firebase retorna el error `auth/user-disabled` al intentar login
- Los datos del usuario se conservan, solo se deshabilita el acceso
- Para reactivar, usar el endpoint `/enable-user/:uid`

Integración en frontend
- Si deseas que los administradores vean la lista completa, configura en el frontend la variable Vite `VITE_ADMIN_API_URL` apuntando a la API (por ejemplo `http://localhost:4001`).
- Opcionalmente guarda la API key en `localStorage.setItem('adminApiKey', '<API_KEY>')` para que `usersService.getUsers()` la use al llamar a `/list-users`.