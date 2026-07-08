# reset-mysql-root.ps1
# Resets the MySQL 8.0 root password to "root".
# Must be run in an elevated (Administrator) PowerShell window.
#
# What it does:
#   1. Stops the MySQL80 Windows service.
#   2. Writes a one-shot SQL init file that ALTERs root's password.
#   3. Boots mysqld manually with --init-file and --skip-networking
#      (so only this local boot can apply the change; nothing else can
#      reach the server during the reset window).
#   4. Stops that temp mysqld.
#   5. Starts the MySQL80 service normally.

$ErrorActionPreference = "Stop"

# Sanity-check we're elevated
$prin = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $prin.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  Write-Error "This script must be run as Administrator. Right-click PowerShell -> Run as Administrator, then re-run."
  exit 1
}

$mysqld   = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe"
$myini    = "C:\ProgramData\MySQL\MySQL Server 8.0\my.ini"
$initFile = "$env:TEMP\mysql-pw-reset.sql"

if (-not (Test-Path $mysqld)) { Write-Error "mysqld not found at $mysqld"; exit 1 }
if (-not (Test-Path $myini))  { Write-Error "my.ini not found at $myini";   exit 1 }

# 1. Stop the service
Write-Host "[1/5] Stopping MySQL80 service..."
Stop-Service MySQL80
Start-Sleep -Seconds 2

# 2. Write the init SQL
Write-Host "[2/5] Writing reset SQL to $initFile"
@"
ALTER USER 'root'@'localhost' IDENTIFIED WITH caching_sha2_password BY 'root';
FLUSH PRIVILEGES;
"@ | Set-Content -Path $initFile -Encoding ASCII

# 3. Boot mysqld manually with the init file
Write-Host "[3/5] Booting temp mysqld with --init-file (skip-networking)..."
$tempProc = Start-Process -FilePath $mysqld `
  -ArgumentList "--defaults-file=`"$myini`"", "--init-file=`"$initFile`"", "--skip-networking", "--console" `
  -PassThru -WindowStyle Hidden
Write-Host "    Temp mysqld PID = $($tempProc.Id). Waiting 10s for init to apply..."
Start-Sleep -Seconds 10

# 4. Stop the temp mysqld
Write-Host "[4/5] Stopping temp mysqld (PID $($tempProc.Id))..."
Stop-Process -Id $tempProc.Id -Force
Start-Sleep -Seconds 3

# Belt-and-suspenders: kill any leftover mysqld processes before the service starts
Get-Process mysqld -ErrorAction SilentlyContinue | ForEach-Object {
  Write-Host "    Killing leftover mysqld PID $($_.Id)"
  Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
}
Start-Sleep -Seconds 2

# 5. Restart the service
Write-Host "[5/5] Starting MySQL80 service..."
Start-Service MySQL80
Start-Sleep -Seconds 3

# Clean up
Remove-Item $initFile -Force -ErrorAction SilentlyContinue

# Verify
Write-Host ""
Write-Host "Verifying..."
$env:MYSQL_PWD = "root"
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -e "SELECT 'root password is now: root' AS status;"
Remove-Item Env:\MYSQL_PWD

Write-Host ""
Write-Host "Done. You can close this window and return to Claude."
