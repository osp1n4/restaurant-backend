Write-Host "================================" -ForegroundColor Cyan
Write-Host "VERIFICACIÓN DE MONGODB" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Puerto accesible
Write-Host "[1/4] Verificando puerto 27017..." -ForegroundColor Yellow
$portTest = Test-NetConnection -ComputerName 127.0.0.1 -Port 27017 -WarningAction SilentlyContinue
if ($portTest.TcpTestSucceeded) {
    Write-Host "✓ Puerto 27017 ACCESIBLE" -ForegroundColor Green
} else {
    Write-Host "✗ Puerto 27017 NO ACCESIBLE" -ForegroundColor Red
    exit
}

# Test 2: Contenedor corriendo
Write-Host "[2/4] Verificando contenedor..." -ForegroundColor Yellow
$container = docker ps --filter "name=restaurant-mongodb" --format "{{.Names}}" 2>$null
if ($container) {
    Write-Host "✓ Contenedor '$container' está corriendo" -ForegroundColor Green
} else {
    Write-Host "✗ Contenedor no encontrado" -ForegroundColor Red
    exit
}

# Test 3: MongoDB respondiendo
Write-Host "[3/4] Verificando MongoDB..." -ForegroundColor Yellow
$ping = docker exec restaurant-mongodb mongosh --eval "db.adminCommand('ping')" --quiet 2>$null
if ($ping -match "ok: 1") {
    Write-Host "✓ MongoDB está respondiendo" -ForegroundColor Green
} else {
    Write-Host "✗ MongoDB no responde" -ForegroundColor Red
    exit
}

# Test 4: Bases de datos
Write-Host "[4/4] Verificando bases de datos..." -ForegroundColor Yellow
$dbs = docker exec restaurant-mongodb mongosh --eval "db.adminCommand({listDatabases: 1, nameOnly: true}).databases.map(d => d.name)" --quiet 2>$null
Write-Host "✓ Bases de datos encontradas:" -ForegroundColor Green
Write-Host $dbs

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "CONFIGURACIÓN PARA COMPASS" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "URI de conexión:" -ForegroundColor Yellow
Write-Host "mongodb://127.0.0.1:27017" -ForegroundColor White -BackgroundColor DarkBlue
Write-Host ""
Write-Host "Instrucciones:" -ForegroundColor Yellow
Write-Host "1. Abre MongoDB Compass"
Write-Host "2. Pega la URI: mongodb://127.0.0.1:27017"
Write-Host "3. Haz clic en Connect"
Write-Host "4. Una vez conectado, busca en el panel izquierdo"
Write-Host "5. Haz clic en el botón Refresh (🔄) si no ves las bases de datos"
Write-Host ""
Write-Host "Si aún no ves las bases de datos:" -ForegroundColor Red
Write-Host "- Intenta conectarte a: mongodb://127.0.0.1:27017/orders"
Write-Host "- O cierra Compass completamente y vuelve a abrirlo"
Write-Host ""
