# Dockerfile for Node.js/Express Server
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY . .

# Expose port
EXPOSE 3001

# Start server (will be overridden by docker-compose command)
CMD ["npm", "start"]

