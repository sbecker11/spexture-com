#!/bin/bash

echo "🧪 Testing React Super App Authentication Flow"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Register a new user
echo "Test 1: User Registration"
echo "-------------------------"
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"testuser@example.com","password":"TestPass123!"}')

if echo "$REGISTER_RESPONSE" | grep -q "token"; then
  echo -e "${GREEN}✅ Registration successful${NC}"
  TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
  echo "   Token received: ${TOKEN:0:20}..."
else
  if echo "$REGISTER_RESPONSE" | grep -q "already exists"; then
    echo -e "${YELLOW}⚠️  User already exists (expected if running multiple times)${NC}"
  else
    echo -e "${RED}❌ Registration failed${NC}"
    echo "   Response: $REGISTER_RESPONSE"
  fi
fi

echo ""

# Test 2: Login with credentials
echo "Test 2: User Login"
echo "------------------"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com","password":"TestPass123!"}')

if echo "$LOGIN_RESPONSE" | grep -q "token"; then
  echo -e "${GREEN}✅ Login successful${NC}"
  TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
  echo "   Token: ${TOKEN:0:20}..."
else
  echo -e "${RED}❌ Login failed${NC}"
  echo "   Response: $LOGIN_RESPONSE"
  exit 1
fi

echo ""

# Test 3: Access protected endpoint with token
echo "Test 3: Access Protected Endpoint"
echo "-----------------------------------"
USER_RESPONSE=$(curl -s -X GET http://localhost:3001/api/users/me \
  -H "Authorization: Bearer $TOKEN")

if echo "$USER_RESPONSE" | grep -q "testuser@example.com"; then
  echo -e "${GREEN}✅ Protected endpoint access successful${NC}"
  echo "   User email verified in response"
else
  echo -e "${RED}❌ Protected endpoint access failed${NC}"
  echo "   Response: $USER_RESPONSE"
fi

echo ""

# Test 4: Try admin login
echo "Test 4: Admin Login"
echo "-------------------"
ADMIN_LOGIN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@react-super-app.local","password":"Admin123!"}')

if echo "$ADMIN_LOGIN" | grep -q "token"; then
  echo -e "${GREEN}✅ Admin login successful${NC}"
  ADMIN_TOKEN=$(echo "$ADMIN_LOGIN" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

  # Check if user has admin role
  if echo "$ADMIN_LOGIN" | grep -q '"role":"admin"'; then
    echo -e "${GREEN}✅ Admin role confirmed${NC}"
  fi
else
  echo -e "${RED}❌ Admin login failed${NC}"
  echo "   Response: $ADMIN_LOGIN"
fi

echo ""

# Test 5: Access without token (should fail)
echo "Test 5: Access Protected Endpoint Without Token"
echo "------------------------------------------------"
NO_AUTH_RESPONSE=$(curl -s -X GET http://localhost:3001/api/users/me)

if echo "$NO_AUTH_RESPONSE" | grep -q "token.*required\|Unauthorized\|No token"; then
  echo -e "${GREEN}✅ Correctly rejected unauthenticated request${NC}"
else
  echo -e "${RED}❌ Should have rejected request without token${NC}"
  echo "   Response: $NO_AUTH_RESPONSE"
fi

echo ""
echo "=============================================="
echo "🎯 Authentication Flow Test Complete"
echo "=============================================="
