# Build stage
FROM node:20-alpine AS build

WORKDIR /app

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# Production serve stage
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

# SPA fallback configuration with backend proxying
RUN echo 'server { \
    listen 80; \
    listen [::]:80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
    location /api/ { \
        proxy_pass http://echo-backend:8000/api/; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
    } \
    location /health { \
        proxy_pass http://echo-backend:8000/health; \
        proxy_set_header Host $host; \
    } \
    location /ready { \
        proxy_pass http://echo-backend:8000/ready; \
        proxy_set_header Host $host; \
    } \
    location /ws/ { \
        proxy_pass http://echo-backend:8000/ws/; \
        proxy_http_version 1.1; \
        proxy_set_header Upgrade $http_upgrade; \
        proxy_set_header Connection "upgrade"; \
        proxy_set_header Host $host; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -qO- http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
