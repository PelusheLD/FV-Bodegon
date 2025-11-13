# Script para crear archivo ZIP para Elastic Beanstalk
# Ejecutar desde la raíz del proyecto: .\create-eb-zip.ps1

$version = "fv-bodegon-backend-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
$zipName = "backend-eb-$version.zip"

Write-Host "Creando ZIP para Elastic Beanstalk..." -ForegroundColor Green
Write-Host "Nombre del archivo: $zipName" -ForegroundColor Yellow
Write-Host "Version label sugerido: $version" -ForegroundColor Yellow
Write-Host ""

# Archivos y carpetas a incluir
$filesToInclude = @(
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "Procfile",
    "server",
    "shared",
    "migrations",
    "public"
)

# Verificar que los archivos existan
$missingFiles = @()
foreach ($file in $filesToInclude) {
    if (-not (Test-Path $file)) {
        if ($file -ne "public") {  # public puede no existir
            $missingFiles += $file
        }
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host "ERROR: Faltan archivos:" -ForegroundColor Red
    $missingFiles | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    exit 1
}

# Crear archivo ZIP temporal
$tempZip = "temp-$version.zip"

# Eliminar ZIP si existe
if (Test-Path $zipName) {
    Remove-Item $zipName -Force
    Write-Host "Eliminado ZIP anterior: $zipName" -ForegroundColor Yellow
}

# Crear nuevo ZIP
Write-Host "Agregando archivos al ZIP..." -ForegroundColor Green

Compress-Archive -Path $filesToInclude -DestinationPath $zipName -Force

# Verificar tamaño del archivo
$zipSize = (Get-Item $zipName).Length / 1MB
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "ZIP creado exitosamente!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "Archivo: $zipName" -ForegroundColor Cyan
Write-Host "Tamaño: $([math]::Round($zipSize, 2)) MB" -ForegroundColor Cyan
Write-Host "Version label: $version" -ForegroundColor Cyan
Write-Host ""
Write-Host "Próximos pasos:" -ForegroundColor Yellow
Write-Host "1. Copia el Version label: $version" -ForegroundColor White
Write-Host "2. Sube el archivo $zipName en Elastic Beanstalk" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Green

