# Script para asignar rol de ADMIN a un usuario
# Uso: .\set-admin-role.ps1 <UID_DEL_USUARIO>

param(
    [Parameter(Mandatory=$true)]
    [string]$UID
)

$ErrorActionPreference = "Stop"

Write-Host "Iniciando script..." -ForegroundColor Gray
Write-Host ""

# Leer el archivo .env si existe
$envFile = Join-Path $PSScriptRoot ".env"
$apiUrl = "http://localhost:4001"
$apiKey = "dev-key"

Write-Host "Buscando archivo .env en: $envFile" -ForegroundColor Gray

if (Test-Path $envFile) {
    Write-Host "Archivo .env encontrado. Leyendo configuracion..." -ForegroundColor Green
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^API_URL=(.+)$') {
            $apiUrl = $matches[1]
            Write-Host "  API_URL encontrado: $apiUrl" -ForegroundColor Gray
        }
        if ($_ -match '^API_KEY=(.+)$') {
            $apiKey = $matches[1]
            Write-Host "  API_KEY encontrado: ****" -ForegroundColor Gray
        }
    }
} else {
    Write-Host "Archivo .env NO encontrado. Usando valores por defecto." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Asignando rol ADMIN al usuario" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "UID: $UID" -ForegroundColor Yellow
Write-Host "API URL: $apiUrl" -ForegroundColor Gray
$keyPreview = $apiKey.Substring(0, [Math]::Min(4, $apiKey.Length))
Write-Host "API KEY: ${keyPreview}****" -ForegroundColor Gray
Write-Host ""

# Preparar el body JSON
$bodyObject = @{
    role = "ADMIN"
    adminClaim = $true
}
$body = $bodyObject | ConvertTo-Json

Write-Host "JSON a enviar: $body" -ForegroundColor Gray
Write-Host "Haciendo peticion HTTP..." -ForegroundColor Gray
Write-Host ""

# Hacer la peticion HTTP
try {
    $fullUrl = "$apiUrl/set-role/$UID"
    Write-Host "URL completa: $fullUrl" -ForegroundColor Gray
    
    $response = Invoke-RestMethod -Uri $fullUrl `
        -Method Post `
        -Headers @{
            "Content-Type" = "application/json"
            "x-api-key" = $apiKey
        } `
        -Body $body `
        -ErrorAction Stop

    Write-Host ""
    Write-Host "Rol asignado exitosamente!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Respuesta del servidor:" -ForegroundColor Gray
    $response | ConvertTo-Json -Depth 3 | Write-Host
    Write-Host ""
    Write-Host "El usuario ahora tiene rol de ADMIN." -ForegroundColor Green
    Write-Host "Por favor, recarga la pagina en el frontend para ver los cambios." -ForegroundColor Yellow
}
catch {
    Write-Host ""
    Write-Host "Error al asignar rol!" -ForegroundColor Red
    Write-Host "Mensaje de error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        Write-Host "Codigo de estado: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "Verifica que:" -ForegroundColor Yellow
    Write-Host "  1. El servicio firebase-admin-api este corriendo en $apiUrl" -ForegroundColor Yellow
    $keyPreview2 = $apiKey.Substring(0, [Math]::Min(4, $apiKey.Length))
    Write-Host "  2. La API_KEY en .env sea correcta (actual: ${keyPreview2}****)" -ForegroundColor Yellow
    Write-Host "  3. El UID del usuario sea valido: $UID" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Prueba ejecutar:" -ForegroundColor Cyan
    Write-Host "  docker-compose ps" -ForegroundColor Cyan
    Write-Host "  docker-compose logs firebase-admin-api" -ForegroundColor Cyan
    exit 1
}
