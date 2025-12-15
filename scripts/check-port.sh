#!/bin/bash

# Port Checker Script
# Checks if a port is in use and prompts user to kill the process

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a port is in use and handle it
check_port() {
    local port=$1
    local service_name=${2:-"service"}
    
    # Check if port is in use
    local port_info=""
    local pid=""
    
    if command -v lsof > /dev/null 2>&1; then
        port_info=$(lsof -i :$port 2>/dev/null | grep LISTEN | head -1)
        if [ -n "$port_info" ]; then
            pid=$(echo "$port_info" | awk '{print $2}')
        fi
    elif command -v netstat > /dev/null 2>&1; then
        # On Linux, netstat format is different
        port_info=$(netstat -tulpn 2>/dev/null | grep ":$port.*LISTEN" | head -1)
        if [ -n "$port_info" ]; then
            # Try to extract PID from netstat output
            pid=$(echo "$port_info" | awk '{print $NF}' | grep -o '[0-9]*' | head -1)
            if [ "$pid" = "-" ] || [ -z "$pid" ]; then
                pid=$(echo "$port_info" | awk '{print $7}' | cut -d'/' -f1)
            fi
        fi
    else
        echo -e "${YELLOW}⚠ Warning: Cannot check port (lsof/netstat not available)${NC}"
        return 0
    fi
    
    if [ -z "$port_info" ]; then
        # Port is free
        return 0
    fi
    
    # Port is in use
    echo -e "${YELLOW}⚠ Port $port is already in use by another process${NC}"
    echo ""
    
    # Try to extract and display process info
    if [ -n "$pid" ] && [ "$pid" != "-" ]; then
        # Get more process details
        local process_name=$(ps -p "$pid" -o comm= 2>/dev/null || echo "")
        local full_command=$(ps -p "$pid" -o command= 2>/dev/null | head -c 80 || echo "")
        
        echo -e "${BLUE}Process details:${NC}"
        echo -e "  PID: $pid"
        if [ -n "$process_name" ]; then
            echo -e "  Command: $process_name"
        fi
        if [ -n "$full_command" ]; then
            echo -e "  Full command: ${full_command}..."
        fi
        echo ""
    else
        echo -e "${YELLOW}⚠ Could not determine process details${NC}"
        echo ""
    fi
    
    # Prompt user
    echo -e "${YELLOW}This port is required for $service_name.${NC}"
    echo ""
    echo -e "Options:"
    echo -e "  1) Kill the process using port $port"
    echo -e "  2) Skip and continue (may cause errors)"
    echo -e "  3) Exit and free the port manually"
    echo ""
    
    while true; do
        read -p "$(echo -e ${BLUE}Choose an option [1/2/3]: ${NC})" choice
        
        case $choice in
            1)
                if [ -n "$pid" ] && [ "$pid" != "-" ] && [ "$pid" != "0" ]; then
                    echo -e "${YELLOW}Killing process $pid...${NC}"
                    if kill -9 "$pid" 2>/dev/null; then
                        echo -e "${GREEN}✓ Process killed successfully${NC}"
                        sleep 1
                        # Verify port is now free
                        local still_in_use=false
                        if command -v lsof > /dev/null 2>&1; then
                            if lsof -i :$port > /dev/null 2>&1; then
                                still_in_use=true
                            fi
                        elif command -v netstat > /dev/null 2>&1; then
                            if netstat -tulpn 2>/dev/null | grep -q ":$port.*LISTEN"; then
                                still_in_use=true
                            fi
                        fi
                        
                        if [ "$still_in_use" = false ]; then
                            echo -e "${GREEN}✓ Port $port is now free${NC}"
                            return 0
                        else
                            echo -e "${RED}✗ Port is still in use. You may need to free it manually.${NC}"
                            return 1
                        fi
                    else
                        echo -e "${RED}✗ Failed to kill process. You may need to use sudo or free the port manually.${NC}"
                        echo -e "${YELLOW}Try: sudo kill -9 $pid${NC}"
                        return 1
                    fi
                else
                    echo -e "${RED}✗ Cannot kill process automatically (PID not available). Please free the port manually.${NC}"
                    if command -v lsof > /dev/null 2>&1; then
                        echo -e "${YELLOW}Run: lsof -i :$port${NC}"
                    elif command -v netstat > /dev/null 2>&1; then
                        echo -e "${YELLOW}Run: netstat -tulpn | grep :$port${NC}"
                    fi
                    return 1
                fi
                ;;
            2)
                echo -e "${YELLOW}⚠ Continuing anyway. Port conflict may cause errors.${NC}"
                return 0
                ;;
            3)
                echo -e "${YELLOW}Exiting. Please free port $port manually and try again.${NC}"
                echo -e "${BLUE}To free the port, run:${NC}"
                echo -e "  lsof -i :$port"
                echo -e "  kill -9 <PID>"
                exit 1
                ;;
            *)
                echo -e "${RED}Invalid option. Please choose 1, 2, or 3.${NC}"
                ;;
        esac
    done
}

# If script is run directly (not sourced), check the port provided as argument
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    if [ -z "$1" ]; then
        echo "Usage: $0 <port> [service_name]"
        echo "Example: $0 5432 PostgreSQL"
        exit 1
    fi
    
    PORT=$1
    SERVICE_NAME=${2:-"a service"}
    
    check_port "$PORT" "$SERVICE_NAME"
    exit $?
fi

