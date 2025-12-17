FROM node:20-slim

RUN apt-get update && apt-get install -y git curl && rm -rf /var/lib/apt/lists/*
RUN npm install -g @anthropic-ai/claude-code

WORKDIR /app
COPY package.json server.js ./
RUN npm install

EXPOSE 3001
CMD ["node", "server.js"]