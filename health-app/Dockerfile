# ── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Webpack bundlea todo en dist/main.js resolviendo los path aliases @/ sin
# necesitar tsconfig-paths en runtime.
RUN echo '{"collection":"@nestjs/schematics","sourceRoot":"src","compilerOptions":{"deleteOutDir":true,"webpack":true}}' > nest-cli.json
RUN npm run build

# ── Stage 2: Production ───────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "dist/main.js"]
