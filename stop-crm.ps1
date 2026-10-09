# Script dừng hệ thống CRM
$ErrorActionPreference = "SilentlyContinue"

# Thiết lập bảng mã UTF-8 cho console
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding  = [System.Text.Encoding]::UTF8
$OutputEncoding           = [System.Text.Encoding]::UTF8
try { chcp 65001 | Out-Null } catch {}

Write-Host "Đang dừng Frontend..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -match "serve.js" } | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "Đang dừng Tomcat..." -ForegroundColor Yellow
$env:CATALINA_HOME = "D:\Tomcat\apache-tomcat-10.1.60"
& "D:\Tomcat\apache-tomcat-10.1.60\bin\catalina.bat" stop

Write-Host "Đang dừng MySQL Container crm-mysql..." -ForegroundColor Yellow
docker stop crm-mysql

Write-Host "Đã dừng các dịch vụ CRM thành công!" -ForegroundColor Green
Write-Host "Để bật lại các container cũ (nếu cần):" -ForegroundColor Cyan
Write-Host "  docker start wordpress dental_db" -ForegroundColor White
