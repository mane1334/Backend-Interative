FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
# Instala dependências incluindo devDependencies necessárias para o build (Vite plugin, etc.)
RUN npm install --include=dev
COPY . .
# Args para Vite
ARG VITE_BASE_URL
ARG VITE_API_URL
# Expor para Vite em tempo de build
ENV VITE_BASE_URL=${VITE_BASE_URL}
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 3002
CMD ["nginx", "-g", "daemon off;"]
