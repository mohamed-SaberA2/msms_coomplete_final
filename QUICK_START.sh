#!/bin/bash

# ============================================
# Hospital Management System - Quick Start
# ============================================

echo "=================================================="
echo "Hospital Management System - Quick Start Setup"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js
echo -e "${YELLOW}Checking Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Please install Node.js 14+${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v) found${NC}"

# Check npm
echo -e "${YELLOW}Checking npm...${NC}"
if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm $(npm -v) found${NC}"

# Check MySQL
echo -e "${YELLOW}Checking MySQL...${NC}"
if ! command -v mysql &> /dev/null; then
    echo -e "${RED}MySQL is not installed. Please install MySQL 5.7+${NC}"
    exit 1
fi
echo -e "${GREEN}✓ MySQL found${NC}"

echo ""
echo -e "${YELLOW}Setting up database...${NC}"

# Create database
mysql -u root << EOF
CREATE DATABASE IF NOT EXISTS hospital_management;
USE hospital_management;
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database created${NC}"
else
    echo -e "${RED}✗ Failed to create database${NC}"
    exit 1
fi

# Import schema
echo -e "${YELLOW}Importing schema...${NC}"
mysql -u root hospital_management < database/schema.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Schema imported${NC}"
else
    echo -e "${RED}✗ Failed to import schema${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Setting up backend...${NC}"

# Install backend dependencies
cd backend
npm install

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backend dependencies installed${NC}"
else
    echo -e "${RED}✗ Failed to install backend dependencies${NC}"
    exit 1
fi

# Create .env if not exists
if [ ! -f .env ]; then
    cp .env.example .env 2>/dev/null || cat > .env << 'ENVEOF'
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=hospital_management
JWT_SECRET=your-secret-key-change-this-in-production
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=debug
ENVEOF
    echo -e "${GREEN}✓ .env file created${NC}"
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

cd ..

echo ""
echo -e "${GREEN}=================================================="
echo "Setup Complete!"
echo "==================================================${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo ""
echo "1. Start the backend server:"
echo -e "   ${GREEN}cd backend${NC}"
echo -e "   ${GREEN}npm start${NC}"
echo ""
echo "2. In another terminal, start the frontend:"
echo -e "   ${GREEN}cd frontend${NC}"
echo -e "   ${GREEN}python3 -m http.server 3000${NC}"
echo ""
echo "3. Open your browser and go to:"
echo -e "   ${GREEN}http://localhost:3000${NC}"
echo ""
echo "4. Login with demo credentials:"
echo -e "   Email: ${GREEN}admin@hospital.com${NC}"
echo -e "   Password: ${GREEN}admin123${NC}"
echo ""
echo -e "${YELLOW}For more information, see SETUP_GUIDE.md${NC}"
echo ""
