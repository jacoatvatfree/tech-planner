FROM node:18-alpine

WORKDIR /app

# Add build arg and env var for port configuration 
ARG VITE_PORT=5173
ENV VITE_PORT=$VITE_PORT

# Copy package files
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Expose the configured port
EXPOSE $VITE_PORT

# Start the development server
CMD ["npm", "run", "preview"]

