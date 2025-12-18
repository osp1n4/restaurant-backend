# Script para asignar rol de KITCHEN (Cocinero) a un usuario
# Uso: .\set-kitchen-role.ps1 <UID_DEL_USUARIO>

param(
    [Parameter(Mandatory=$true)]
    [string]$UID
)

# Leer el archivo .env si existe
$envFile = Join-Path $PSScriptRoot ".env"
$apiUrl = "http://localhost:4001"
$apiKey = "dev-key"

if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^API_URL=(.+)$') {
            $apiUrl = $matches[1]
        }
        if ($_ -match '^API_KEY=(.+)$') {
            $apiKey = $matches[1]
        }
    }
}

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Asignando rol KITCHEN al usuario" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "UID: $UID" -ForegroundColor Yellow
Write-Host "API URL: $apiUrl" -ForegroundColor Gray
Write-Host ""

# Preparar el body JSON
$body = @{
    role = "KITCHEN"
    adminClaim = $false
} | ConvertTo-Json

# Hacer la petición HTTP
try {
    $response = Invoke-RestMethod -Uri "$apiUrl/set-role/$UID" `
        -Method Post `
        -Headers @{
            "Content-Type" = "application/json"
            "x-api-key" = $apiKey
        } `
        -Body $body

    Write-Host "✓ Rol asignado exitosamente" -ForegroundColor Green
    Write-Host "Respuesta del servidor:" -ForegroundColor Gray
    $response | ConvertTo-Json -Depth 3 | Write-Host
    Write-Host ""
    Write-Host "El usuario ahora tiene rol de KITCHEN (Cocinero)." -ForegroundColor Green
    Write-Host "Por favor, recarga la página en el frontend para ver los cambios." -ForegroundColor Yellow
}
catch {
    Write-Host "✗ Error al asignar rol" -ForegroundColor Red
    Write-Host "Mensaje de error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Verifica que:" -ForegroundColor Yellow
    Write-Host "  1. El servicio firebase-admin-api esté corriendo" -ForegroundColor Yellow
    Write-Host "  2. La API_KEY en .env sea correcta" -ForegroundColor Yellow
    Write-Host "  3. El UID del usuario sea válido" -ForegroundColor Yellow
    exit 1
}
