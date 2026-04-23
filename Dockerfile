FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
COPY --from=builder /app/prisma ./prisma
RUN npm ci --omit=dev
RUN npx prisma generate
COPY --from=builder /app/dist ./dist
EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]