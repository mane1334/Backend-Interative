# Multi-stage Dockerfile para o admin-panel (Vite + Nginx) com npm workspaces

# Etapa 1: Build
FROM node:20-alpine AS builder
WORKDIR /repo

# Copia manifests do monorepo (usa o package-lock.json da raiz)
COPY package.json package-lock.json ./
# Copia o manifest do workspace do admin-panel para permitir resolução de deps no workspace
COPY admin-panel/package.json admin-panel/package.json

# Instala somente as dependências do workspace admin-panel usando o lockfile da raiz
RUN npm ci --include-workspace-root=false --workspace admin-panel

# Copia o restante do código do workspace
COPY admin-panel/ admin-panel/

# Variáveis de ambiente de build (Vite lê import.meta.env em tempo de build)
ARG VITE_API_URL
ARG VITE_WS_URL
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_WS_URL=${VITE_WS_URL}

# Executa o build do workspace
RUN npm run build -w admin-panel

# Etapa 2: Servir com Nginx
FROM nginx:alpine

# Remove configuração default e adiciona nossa (SPA fallback)
RUN rm -f /etc/nginx/conf.d/default.conf
COPY admin-panel/docker/nginx/default.conf /etc/nginx/conf.d/default.conf

# Copia artefatos do build gerados pelo workspace
COPY --from=builder /repo/admin-panel/dist /usr/share/nginx/html

# Exposição da porta padrão do Nginx
EXPOSE 80

# Comando padrão
CMD ["nginx", "-g", "daemon off;"]
