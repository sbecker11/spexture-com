#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PROJECT_ROOT="/Users/sbecker11/workspace-react/react-super-app"

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}Client Coverage Report Generator${NC}"
echo -e "${BLUE}======================================${NC}\n"

# Change to project directory
cd "$PROJECT_ROOT"

# Step 1: Run tests with coverage
echo -e "${YELLOW}Step 1/3: Running client tests with coverage...${NC}"
npm run test:coverage

# Step 2: Generate HTML report
echo -e "\n${YELLOW}Step 2/3: Generating HTML report...${NC}"
cd coverage-reports
pandoc -s --metadata title="Client Coverage Report" -c "data:text/css,table{border-collapse:collapse;width:100%}th,td{border:1px solid \#ddd;padding:8px 12px;text-align:left}th{background:\#1a1a2e;color:white}tr:nth-child(even){background:\#f9f9f9}code{background:\#e8e8e8;padding:2px 6px;border-radius:4px}" client-coverage.md -o client-coverage.html 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ HTML report generated successfully!${NC}"
else
    echo -e "${YELLOW}⚠ Pandoc not installed - HTML generation skipped${NC}"
fi

# Step 3: Show completion message
echo -e "\n${GREEN}======================================${NC}"
echo -e "${GREEN}✓ Coverage report generation complete!${NC}"
echo -e "${GREEN}======================================${NC}\n"

echo -e "${BLUE}Next steps:${NC}"
echo -e "1. Refresh the admin testing page: ${BLUE}http://localhost:3000/admin/testing${NC}"
echo -e "2. Or view HTML report: ${BLUE}http://localhost:3001/api/coverage/html/client${NC}\n"

echo -e "${YELLOW}Press any key to close this window...${NC}"
read -n 1 -s
