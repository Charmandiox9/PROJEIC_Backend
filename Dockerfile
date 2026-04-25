# ─── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# ─── Stage 2: imagen final ─────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Solo dependencias de producción
COPY package*.json ./
COPY --from=builder /app/prisma ./prisma
RUN npm ci --omit=dev

# Regenerar cliente Prisma en la imagen final (para el SO/arquitectura correctos)
RUN npx prisma generate

# Código compilado
COPY --from=builder /app/dist ./dist

# Directorio de uploads (debe existir en runtime para ServeStaticModule)
RUN mkdir -p uploads

EXPOSE 4000
# Ejecuta migraciones y luego arranca el servidor
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]