# Берем официальный образ Node.js для сборки
FROM node:18-alpine AS builder

# Рабочая директория
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci

# Копируем исходный код
COPY . .

# Собираем приложение (результат в /app/build)
RUN npm run build

# ====== Финальный образ с Nginx ======
FROM nginx:alpine

# Копируем собранные файлы из builder в Nginx
COPY --from=builder /app/build /usr/share/nginx/html

# Копируем кастомный nginx.conf (если нужен)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Открываем 80 порт (HTTP)
EXPOSE 80

# Запускаем Nginx
CMD ["nginx", "-g", "daemon off;"]