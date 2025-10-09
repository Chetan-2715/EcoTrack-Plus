# EcoTrack+ Startup Script
Write-Host "🌱 Starting EcoTrack+ Development Server..." -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Check if npm packages are installed
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
}

Write-Host "🚀 Starting development server..." -ForegroundColor Blue
Write-Host "   • Server will be available at http://localhost:5000" -ForegroundColor Cyan
Write-Host "   • Press Ctrl+C to stop the server" -ForegroundColor Cyan
Write-Host ""

# Start the development server
npm run dev
