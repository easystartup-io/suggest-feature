# Build stage
FROM node:14-slim AS build

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --only=production

# Production stage
FROM node:14-slim

# Install dependencies for Puppeteer
RUN apt-get update && apt-get install -y \
  gconf-service libasound2 libatk1.0-0 libatk-bridge2.0-0 libc6 libcairo2 libcups2 libdbus-1-3 \
  libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 \
  libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 \
  libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 \
  libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release \
  xdg-utils wget \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

# Create a non-root user
RUN groupadd -r appuser && useradd -r -g appuser -G audio,video appuser \
  && mkdir -p /home/appuser/Downloads \
  && chown -R appuser:appuser /home/appuser

WORKDIR /usr/src/app

# Copy built node modules and compiled app from build stage
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY . .

# Set ownership to non-root user
RUN chown -R appuser:appuser /usr/src/app

USER appuser

EXPOSE 9191

CMD ["node", "app.js"]
