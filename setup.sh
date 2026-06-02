#!/bin/bash

# EmberNet Setup Script for macOS/Linux
# This script sets up the development environment on Unix-like systems

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "\n${BLUE}========================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================================${NC}\n"
}

print_step() {
    echo -e "${BLUE}[$1/6]${NC} $2"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Start
print_header "🚀 EmberNet Setup for macOS/Linux"

# Step 1: Check Node.js
print_step "1" "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    print_error "Node.js not found"
    echo ""
    echo "Install Node.js from: https://nodejs.org/"
    echo "Or use your package manager:"
    echo "  macOS: brew install node"
    echo "  Linux: apt-get install nodejs npm (or yum install nodejs npm)"
    exit 1
fi
NODE_VERSION=$(node --version)
print_success "Node.js found: $NODE_VERSION"

# Step 2: Check npm
print_step "2" "Checking npm installation..."
if ! command -v npm &> /dev/null; then
    print_error "npm not found"
    exit 1
fi
NPM_VERSION=$(npm --version)
print_success "npm found: v$NPM_VERSION"

# Step 3: Install dependencies
print_step "3" "Installing npm dependencies..."
echo "Running: npm install"
npm install
print_success "Dependencies installed"

# Step 4: Check Redis
print_step "4" "Checking Redis installation..."
if ! command -v redis-cli &> /dev/null; then
    print_warning "redis-cli not found (but may still work)"
    echo ""
    echo "To install Redis, choose ONE option:"
    echo ""
    echo "  Option A: Homebrew (macOS)"
    echo "    brew install redis"
    echo "    brew services start redis"
    echo ""
    echo "  Option B: apt (Linux Ubuntu/Debian)"
    echo "    sudo apt-get install redis-server"
    echo "    sudo systemctl start redis-server"
    echo ""
    echo "  Option C: Docker (all platforms)"
    echo "    docker run -d -p 6379:6379 redis:latest"
    echo ""
    echo "  Option D: Snap (Linux)"
    echo "    sudo snap install redis"
    echo ""
    echo "Proceeding with setup (verify Redis manually before running npm run dev)"
else
    REDIS_VERSION=$(redis-cli --version)
    print_success "Redis found: $REDIS_VERSION"
fi

# Step 5: Create .env.local
print_step "5" "Configuring environment..."
if [ ! -f .env.local ]; then
    cat > .env.local << EOF
REDIS_URL=redis://localhost:6379
NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=development
EOF
    print_success "Created .env.local"
else
    echo "ℹ️  .env.local already exists"
fi

# Step 6: Done
print_step "6" "Setup complete!"
echo ""
print_header "🎉 Ready to develop!"
echo ""
echo "  Next steps:"
echo "    1. Make sure Redis is running"
echo "    2. Run: npm run dev"
echo "    3. Open: http://localhost:3000"
echo ""
echo "  To verify Redis is running:"
echo "    redis-cli ping"
echo "    (Should return: PONG)"
echo ""
print_header "Happy coding! 🚀"
