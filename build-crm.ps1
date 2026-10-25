# Build script for CRM
$ErrorActionPreference = "Stop"
$javac = "C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot\bin\javac.exe"
$outDir = "D:\Tomcat\apache-tomcat-10.1.60\webapps\crm\WEB-INF\classes"
$cp = "D:\Tomcat\apache-tomcat-10.1.60\lib\*;D:\Tomcat\apache-tomcat-10.1.60\webapps\crm\WEB-INF\lib\*"

Write-Host "Collecting java files..."
$files = Get-ChildItem -Path "d:\quan-ly-khach-hang\backend\src\main\java" -Filter "*.java" -Recurse | ForEach-Object { $_.FullName }
$sourceListFile = "d:\quan-ly-khach-hang\backend\sources.txt"
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllLines($sourceListFile, $files, $utf8NoBom)

Write-Host "Compiling $($files.Count) files..."
& $javac -encoding UTF-8 -cp $cp -d $outDir "@$sourceListFile"
if ($LASTEXITCODE -eq 0) {
    Write-Host "Compilation SUCCESS!" -ForegroundColor Green
} else {
    Write-Host "Compilation FAILED with code $LASTEXITCODE" -ForegroundColor Red
}

Write-Host "Syncing webapp/frontend assets..."
Copy-Item -Path "d:\quan-ly-khach-hang\frontend\*" -Destination "D:\Tomcat\apache-tomcat-10.1.60\webapps\crm" -Recurse -Force
Copy-Item -Path "d:\quan-ly-khach-hang\frontend\*" -Destination "d:\quan-ly-khach-hang\backend\src\main\webapp" -Recurse -Force
Write-Host "Assets synced successfully." -ForegroundColor Green
