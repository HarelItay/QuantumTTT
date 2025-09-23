#!/bin/bash

# Quantum Tic-Tac-Toe GitHub Pages Deployment Helper
# This script helps you deploy your game to GitHub Pages

echo "🌟 Quantum Tic-Tac-Toe GitHub Pages Deployment Helper 🌟"
echo "============================================================"
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first:"
    echo "   Visit: https://git-scm.com/downloads"
    exit 1
fi

echo "✅ Git is installed"
echo ""

# Check if we're in the right directory
if [[ ! -f "index.html" || ! -f "style.css" || ! -f "script.js" ]]; then
    echo "❌ Please run this script from the QTTT directory containing your game files"
    exit 1
fi

echo "✅ Game files found"
echo ""

echo "📋 DEPLOYMENT STEPS:"
echo "==================="
echo ""

echo "1️⃣  FIRST: Create a GitHub repository manually:"
echo "   • Go to https://github.com"
echo "   • Click '+' → New repository"
echo "   • Name: quantum-tic-tac-toe (or your choice)"
echo "   • Make it PUBLIC (required for free GitHub Pages)"
echo "   • DON'T initialize with README (we have files already)"
echo "   • Click 'Create repository'"
echo ""

echo "2️⃣  THEN: Copy and paste these commands one by one:"
echo ""

# Get current directory name for repository name suggestion
DIR_NAME=$(basename "$PWD")

echo "# Initialize git repository"
echo "git init"
echo ""

echo "# Add all your game files"
echo "git add ."
echo ""

echo "# Make your first commit"
echo "git commit -m 'Deploy Quantum Tic-Tac-Toe game'"
echo ""

echo "# Add your GitHub repository as origin (REPLACE with your actual repository URL)"
echo "git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY-NAME.git"
echo ""

echo "# Push to GitHub"
echo "git branch -M main"
echo "git push -u origin main"
echo ""

echo "3️⃣  FINALLY: Enable GitHub Pages:"
echo "   • Go to your repository on GitHub"
echo "   • Click 'Settings' tab"
echo "   • Scroll to 'Pages' in left sidebar"
echo "   • Source: 'Deploy from a branch'"
echo "   • Branch: 'main' → '/ (root)'"
echo "   • Click 'Save'"
echo ""

echo "🚀 Your game will be live at:"
echo "   https://YOUR-USERNAME.github.io/YOUR-REPOSITORY-NAME/"
echo ""

echo "💡 TIPS:"
echo "======="
echo "• Replace YOUR-USERNAME with your actual GitHub username"
echo "• Replace YOUR-REPOSITORY-NAME with your actual repository name"
echo "• It may take 5-10 minutes for GitHub Pages to become active"
echo "• The site URL will be shown in your repository's Pages settings"
echo ""

echo "❓ Need help? Check the README.md file for detailed instructions!"
echo ""
echo "Happy deploying! 🎮✨"
