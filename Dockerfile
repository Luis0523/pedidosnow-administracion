FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV APP_VERSION=V1

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 3001

CMD ["node", "server.js"]
