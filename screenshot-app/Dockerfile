# Use the official Node.js image that supports ARM architecture
FROM node:18-bullseye-slim

# Install necessary dependencies for running Puppeteer with Chromium
RUN apt-get update && apt-get install -y \
  fonts-liberation \
  libasound2 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libcups2 \
  libdrm2 \
  libgbm1 \
  libnspr4 \
  libnss3 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  xdg-utils \
  wget \
  && rm -rf /var/lib/apt/lists/*

# Install Chromium for Puppeteer (ARM-compatible version)
RUN apt-get update && apt-get install -y chromium

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to install dependencies
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app's source code to the working directory
COPY . .

# Set environment variable for Puppeteer to use installed Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Expose the port the app runs on
EXPOSE 9191

# Run the application
CMD ["node", "app.js"]
