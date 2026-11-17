@echo off
setlocal EnableExtensions DisableDelayedExpansion
chcp 65001 >nul
cd /d "%~dp0"
title ALI Academy - Nhap 100 tai khoan (Firebase Spark)
echo ===================================================
echo ALI ACADEMY - NHAP EXCEL 100 HOC VIEN - SPARK FREE
echo ===================================================
where node >nul 2>nul
if errorlevel 1 (
 echo Chua cai Node.js 22+ - tai tai https://nodejs.org/
 pause
 exit /b 1
)
if not exist "node_modules\exceljs" (
 echo Cai thu vien lan dau - can ket noi Internet...
 call npm install --no-audit --no-fund
 if errorlevel 1 (
  echo Cai thu vien that bai. Kiem tra Internet.
  pause
  exit /b 1
 )
)
if not exist "ALI_Mau_100_Hoc_Vien.xlsx" node create-students.cjs --template
echo.
echo Mo file mau ALI_Mau_100_Hoc_Vien.xlsx de dien thong tin.
echo Ban co the keo tha file da dien vao cua so nay.
echo.
set "ALI_INPUT=%~1"
if not defined ALI_INPUT set /p "ALI_INPUT=Nhap duong dan file Excel (.xlsx) hoac CSV: "
set "ALI_INPUT=%ALI_INPUT:"=%"
if not exist "%ALI_INPUT%" (
 echo Khong tim thay file Excel.
 pause
 exit /b 1
)
echo.
echo === KIEM TRA DU LIEU - CHUA TAO TAI KHOAN ===
node create-students.cjs "%ALI_INPUT%"
if errorlevel 1 (
 echo File chua hop le. Hay sua Excel va chay lai.
 pause
 exit /b 1
)
echo.
echo Ban da kiem tra ky danh sach va duoc uy quyen?
choice /C YN /N /M "Nhan Y de TAO TAI KHOAN THAT, N de huy: "
if errorlevel 2 (
 echo Da huy, khong tao tai khoan.
 pause
 exit /b 0
)
echo.
node create-students.cjs "%ALI_INPUT%" --apply
echo.
echo Bao cao va mat khau tam o thu muc private-output.
echo Khong chia se file mat khau cho nguoi khac.
pause
