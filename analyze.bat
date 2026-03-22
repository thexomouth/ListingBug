@echo off
cd /d "C:\Users\User\Downloads\ListingBug FIGMA MVP"
npm install pngjs --save-dev 2>&1
node analyze-logo.cjs
