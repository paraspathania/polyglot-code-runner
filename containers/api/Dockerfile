FROM node:20-alpine

RUN apk add --no-cache docker-cli

WORKDIR /app

COPY src/package*.json ./
RUN npm install

COPY src/ ./
RUN npm run build

CMD ["npm", "start"]
