#!/bin/bash
# ListingBug quick push script
# Usage: ./push.sh "your commit message"
# Or just: ./push.sh  (uses a default message)

cd /Users/jake/ListingBug-main

MESSAGE=${1:-"chore: update"}

git add -A
git commit -m "$MESSAGE"
git push origin main
