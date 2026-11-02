@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ================================================
echo  Menyalakan SortTrip lokal...
echo ================================================
start "SortTrip Worker Muse - JANGAN DITUTUP" cmd /k "npm run dev:worker:muse"
start "SortTrip App - JANGAN DITUTUP" cmd /k "npm run dev"
echo Menunggu aplikasi siap (maks 2 menit)...
powershell -NoProfile -Command "for($t=0;$t -lt 120;$t+=3){ try{$r=Invoke-WebRequest -Uri http://127.0.0.1:5173/ -UseBasicParsing -TimeoutSec 5; if($r.StatusCode -eq 200){'Aplikasi siap.'; exit 0}}catch{}; Start-Sleep -Seconds 3 }; 'GAGAL: aplikasi tidak siap dalam 2 menit. Lihat 2 jendela hitam untuk pesan error.'; exit 1"
if errorlevel 1 ( echo. & pause & exit /b 1 )
echo Membuka browser...
start http://127.0.0.1:5173
echo.
echo ================================================
echo  Selesai. Browser terbuka otomatis.
echo  JANGAN tutup 2 jendela hitam selama memakai app.
echo  Kalau selesai, tutup kedua jendela hitam itu.
echo ================================================
pause
