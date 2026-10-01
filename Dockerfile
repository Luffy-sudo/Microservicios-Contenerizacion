# Multi-stage Dockerfile para API Cambio de Monedas
FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

COPY package*.json ./
RUN npm install --omit=dev
RUN npm install -g tsx

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src ./src
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/BD ./BD
COPY --from=builder /app/tsconfig.json ./

EXPOSE 3000

CMD ["tsx", "server.ts"]
