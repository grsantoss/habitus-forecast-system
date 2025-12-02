# Dockerfile Multi-stage para Frontend Habitus Forecast
# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package.json pnpm-lock.yaml* ./

# Instalar pnpm e dependências
RUN npm install -g pnpm@latest && \
    pnpm install --frozen-lockfile

# Copiar código fonte
COPY . .

# Build da aplicação
RUN pnpm run build

# Stage 2: Production - Copiar build para backend
FROM python:3.11-slim

WORKDIR /app

# Copiar apenas os arquivos buildados para o diretório static do backend
COPY --from=builder /app/dist /app/static

# Este Dockerfile é usado apenas para build do frontend
# Os arquivos serão copiados para o backend durante o build do docker-compose

