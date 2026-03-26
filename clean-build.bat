@echo off
cd /d "C:\Users\User\Downloads\ListingBug FIGMA MVP"
rmdir /s /q build
npm run build 2>&1
