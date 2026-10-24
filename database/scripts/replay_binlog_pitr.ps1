<#
.SYNOPSIS
    Point-in-Time Recovery (PITR) Binary Log Replay Utility (ICT3222 ADBMS).
.DESCRIPTION
    Replays MySQL binary log transactions from a specific starting coordinate or binlog file
    up to a target timestamp or position immediately prior to a disaster (e.g. accidental DROP/DELETE).
#>

[CmdletBinding()]
param (
    [Parameter(Mandatory=$true)]
    [string]$StopDateTime,   # e.g., "2026-10-18 14:32:14"
    [string]$StartDateTime = "",
    [int]$StartPosition = 0,
    [int]$StopPosition = 0,
    [string[]]$BinlogFiles = @(),
    [string]$DbUser = "root",
    [string]$DbPassword = "1234",
    [string]$DbName = "supermarket_db",
    [string]$DbHost = "localhost",
    [int]$DbPort = 3306
)

$ErrorActionPreference = "Stop"

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "   SUPERMARKET ADBMS - POINT-IN-TIME RECOVERY (PITR) ENGINE     " -ForegroundColor Cyan
Write-Host "   Differential Transaction Log Replayer via mysqlbinlog        " -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

# Locate mysqlbinlog.exe & mysql.exe
$mysqlbinlogPath = ""
$commandCheck = Get-Command "mysqlbinlog.exe" -ErrorAction SilentlyContinue
if ($commandCheck) {
    $mysqlbinlogPath = $commandCheck.Source
} else {
    $candidates = @(
        "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqlbinlog.exe",
        "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqlbinlog.exe",
        "C:\Program Files\MySQL\MySQL Server 9.0\bin\mysqlbinlog.exe",
        "C:\Program Files (x86)\MySQL\MySQL Server 8.0\bin\mysqlbinlog.exe"
    )
    foreach ($cand in $candidates) {
        if (Test-Path $cand) {
            $mysqlbinlogPath = $cand
            break
        }
    }
}

if ([string]::IsNullOrWhiteSpace($mysqlbinlogPath)) {
    Write-Error "mysqlbinlog.exe could not be found."
    exit 1
}

$mysqlPath = [System.IO.Path]::Combine((Split-Path -Parent $mysqlbinlogPath), "mysql.exe")

Write-Host "[+] Found mysqlbinlog binary at: $mysqlbinlogPath" -ForegroundColor Green
Write-Host "[+] Target Disaster Cut-off: $StopDateTime" -ForegroundColor Yellow

# If no binlog files specified, query MySQL for the active log files
if ($BinlogFiles.Count -eq 0) {
    Write-Host "[+] Discovering active binary log files from MySQL..." -ForegroundColor Cyan
    $binlogsOutput = & $mysqlPath --host=$DbHost --port=$DbPort --user=$DbUser --password=$DbPassword -e "SHOW BINARY LOGS;" 2>$null
    Write-Host $binlogsOutput
}

Write-Host "`n[+] Instructions for PITR execution:" -ForegroundColor White
Write-Host " 1. Re-run restore_database.ps1 to lay down the base consistent snapshot." -ForegroundColor White
Write-Host " 2. Run mysqlbinlog with --stop-datetime='$StopDateTime' on the relevant binlogs:" -ForegroundColor White
Write-Host "    & '$mysqlbinlogPath' --database=$DbName --stop-datetime='$StopDateTime' <path_to_binlog> | & '$mysqlPath' -u $DbUser -p $DbName" -ForegroundColor Cyan
Write-Host " 3. Verify target records prior to the disaster are fully recovered." -ForegroundColor White
Write-Host "================================================================`n" -ForegroundColor Green
