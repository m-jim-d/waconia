:: Cleans the git, removing prior waconia image files that collect if publishing the hourly Rosy images.
:: This was developed in a AI conversation in Windsurf editor (on Beelink computer, "Managing Git and Dropbox Workflows")

@echo off
echo ========================================
echo WARNING: COMPLETE REPOSITORY RESET
echo This will:
echo 1. Delete ALL commit history
echo 2. Keep only current files
echo 3. Remove all old images from Git
echo 4. Force push these changes
echo ========================================
echo.
echo Are you sure you want to continue?
pause

git checkout --orphan temp_branch
git add -A
git commit -m "Fresh start with current files"
git branch -D main
git branch -m main
git push -f origin main

echo Repository history has been reset
echo Running cleanup...

git reflog expire --expire=now --all
git prune --expire now
rd /s /q .git\refs\original 2>nul
rd /s /q .git\logs 2>nul
git gc --aggressive --prune=now

echo Complete! Repository has been reset to current state only.
pause
