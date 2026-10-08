# Script khởi động toàn bộ dự án Quản Lý Khách Hàng - CRM (Frontend + Backend gộp chung trên Tomcat)
$ErrorActionPreference = "Stop"

# Thiết lập bảng mã UTF-8 cho console để hiển thị tiếng Việt chính xác
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding  = [System.Text.Encoding]::UTF8
$OutputEncoding           = [System.Text.Encoding]::UTF8
try { chcp 65001 | Out-Null } catch {}

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  KHỞI ĐỘNG HỆ THỐNG CRM - QUẢN LÝ KHÁCH HÀNG" -ForegroundColor Cyan
Write-Host "   (Hệ thống hợp nhất Frontend & Backend)   " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. Khởi động MySQL Docker Container
Write-Host "[1/2] Đang kiểm tra và khởi động MySQL container (crm-mysql)..." -ForegroundColor Yellow
$mysqlRunning = docker ps --filter "name=crm-mysql" --filter "status=running" -q
if (-not $mysqlRunning) {
    $conflict = docker ps --filter "publish=3306" --format "{{.Names}}" | Where-Object { $_ -ne "crm-mysql" }
    if ($conflict) {
        Write-Host "  Tạm dừng container đang chiếm cổng 3306 ($conflict)..." -ForegroundColor DarkYellow
        docker stop $conflict | Out-Null
    }
    $mysqlExists = docker ps -a --filter "name=crm-mysql" -q
    if ($mysqlExists) {
        docker start crm-mysql | Out-Null
    } else {
        docker run -d --name crm-mysql -p 3306:3306 -e MYSQL_ROOT_PASSWORD=123456 -e MYSQL_DATABASE=crm_db mysql:8.0 --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci | Out-Null
    }
    Start-Sleep -Seconds 3
}
Write-Host "MySQL đang chạy tại localhost:3306 (db: crm_db)" -ForegroundColor Green

# 2. Khởi động Apache Tomcat (Chạy cả Frontend và Backend API)
Write-Host "[2/2] Đang khởi động Apache Tomcat (port 8080)..." -ForegroundColor Yellow
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot"
$env:CATALINA_HOME = "D:\Tomcat\apache-tomcat-10.1.60"

# Kiểm tra xem Tomcat đã chạy chưa
$tomcatPort = Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue
if (-not $tomcatPort) {
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c set CATALINA_HOME=D:\Tomcat\apache-tomcat-10.1.60&& D:\Tomcat\apache-tomcat-10.1.60\bin\startup.bat" -WindowStyle Minimized
    $waited = 0
    while ($waited -lt 15) {
        Start-Sleep -Seconds 2
        $waited += 2
        if (Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue) { break }
    }
}
Write-Host "Hệ thống CRM (Frontend + Backend) đang chạy tại: http://localhost:8080/crm" -ForegroundColor Green

Write-Host "`n>>> ĐĂNG NHẬP HỆ THỐNG <<<" -ForegroundColor Cyan
Write-Host "URL:       http://localhost:8080/crm/login" -ForegroundColor White
Write-Host "Tài khoản: admin@crm.local" -ForegroundColor White
Write-Host "Mật khẩu:  AdminPassword123!" -ForegroundColor White

# Mở trình duyệt mặc định
Start-Process "http://localhost:8080/crm/login"
