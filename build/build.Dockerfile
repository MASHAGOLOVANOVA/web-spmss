FROM golang
WORKDIR /mvp-2-spms
# Устанавливаем переменные окружения
ENV CGO_ENABLED=0
ENV GOOS=linux

# Копируем go.mod и go.sum для установки зависимостей
COPY go.mod go.sum ./

RUN go mod download

# Копируем остальное приложение
COPY . .
COPY server_config.json /web_server/cmd/web_app/server_config.json
   


# Установка make
RUN apt-get update && apt-get install -y make

# Выполнение команды сборки из Makefile
RUN make run-commands-to-build-go

CMD ["./web_server/cmd/web_app/web_app"]

