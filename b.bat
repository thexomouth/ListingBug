@echo off
cd /d "C:\Users\User\Downloads\ListingBug FIGMA MVP"
npm run build 2>&1 | findstr /i "error built"
