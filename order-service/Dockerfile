# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias (incluyendo devDependencies para compilar)
RUN npm install

# Copiar código fuente y configuración
COPY tsconfig.json ./
COPY src ./src

# Compilar TypeScript a JavaScript
RUN npm run build

# Validar que la compilación fue exitosa
RUN test -d dist || (echo "❌ Build failed: dist directory not created" && exit 1)

# Stage 2: Runtime
FROM node:20-alpine

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm install --production

# Copiar código compilado desde builder
COPY --from=builder /app/dist ./dist

# Copiar archivos de configuración necesarios
COPY .env* ./

# Exponer puerto
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Comando para iniciar
CMD ["npm", "start"]

