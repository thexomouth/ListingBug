@echo off
cd /d "C:\Users\User\Downloads\ListingBug FIGMA MVP"
"C:\Program Files\Git\bin\git.exe" add -A
"C:\Program Files\Git\bin\git.exe" commit -m "fix: repair AutomationsManagementPage corruption + add missing last_run_at/next_run_at columns to automations table"
"C:\Program Files\Git\bin\git.exe" push origin main
echo DONE
