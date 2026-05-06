FROM node:22-alpine AS build

WORKDIR /app

ARG API_BASE_URL
ARG WS_URL

COPY devops-hub-contracts/package*.json ./devops-hub-contracts/
COPY devops-hub-contracts/tsconfig.json ./devops-hub-contracts/
COPY devops-hub-contracts/src ./devops-hub-contracts/src

WORKDIR /app/devops-hub-contracts
RUN npm ci && npm run build

WORKDIR /app/devops-hub-web
COPY devops-hub-web/package*.json ./
RUN npm ci
COPY devops-hub-web ./
RUN node -e "const fs=require('fs'); const p='src/environments/environment.production.ts'; let s=fs.readFileSync(p,'utf8'); s=s.replace('__API_BASE_URL__', process.env.API_BASE_URL || 'https://replace-with-api-url/api').replace('__WS_URL__', process.env.WS_URL || 'https://replace-with-api-url/realtime'); fs.writeFileSync(p,s);" \
    && CI=1 npm run build -- --progress=false

FROM nginx:1.27-alpine

COPY --from=build /app/devops-hub-web/dist/devops-hub-web/browser /usr/share/nginx/html
COPY devops-hub-web/nginx.conf /etc/nginx/nginx.conf
