# Student project management system

## Описание 

Серверная сторона системы. Предоставляет HTTP API для работы с бд и интеграциями. У всех запросов префикс /api/v1

Большинство запросов представлено в swagger.yml, однако не все они могут быть корректными к текущей версии, все маршруты и их обработчики хранятся в web_server/routes

### Возможности

<details>
<summary>Работа с проектами студентов</summary>
<br>

* Создание проекта
* Просмотр проекта
* Просмотр списка проектов (+ фильтрация по статусу)
* Изменение проекта
* Сбор статистики проекта
* Внесение оценок за проект + отзыв руководителя
* Просмотр коммитов проекта (интеграция github)
* Получение списка статусов и стадий проекта (для frontend)

</details>

<details>
<summary>Работа с заданиями проектов</summary>
<br>

* Создание задания
* Просмотр заданий
* Изменение задания
* Получение списка статусов заданий (для frontend)

</details>

<details>
<summary>Работа со студентом</summary>
<br>

* Создание студента
* Просмотр студента

</details>


<details>
<summary>Работа со встречами</summary>
<br>

* Создание встречи
* Просмотр встреч с фильтрацией по времени начала
* Получение списка статуса встреч (для frontend)

</details>


<details>
<summary>Работа с аккаунтом</summary>
<br>

* Вход
* Регистрация
* Выход
* Вход через бота (без ввода пароля) 
* Просмотр профиля
* Просмотр интеграций профиля
* Обновление сессии
* Проверка актуальности сессии

</details>


<details>
<summary>Работа с интеграциями</summary>
<br>

* Получение ссылки для авторизации (для google drive, calendar, github)
* Маршруты для авторизации OAuth 2.0
* Получение списка планировщиков (при подключенной интеграции)
* Установка планировщика для создания там событий

</details>

<details>
<summary>Работа с университетами</summary>
<br>

* Получение списка образовательных программ университета

</details>

### Основная информация про работу приложения

>  Серверное приложение на языке Go, которое работает с MySQL db, API google и API github. Основана на чистой архитектуре

> Авторизация пользователей происходит посредством сессий (создание уникальной строки со сроком годности, которая хранится в локальной памяти и отдается на frontend). Для передачи сессии в запрос используется заголовок Session-Id

> Пароли хэшируются с уникальной солью и хранятся в бд. 

> Сервер конфигурируется файлами server_config.json, db_config.json. 

> Была предусмотрена поддержка расширения интеграций с другими сервисами.

## Запуск и работа с сервером

### Подготовка 

#### Конфигурация

Для работы с сервером требуется создать файлы конфигурации:

*server_config.json*

Пример:

```
{
    "addr": "http://localhost",
    "port": ":8080",
    "return_url": "http://localhost:8080"
}
```

Где указываются адрес и порт сервера, а также адрес, на который сторонние сервисы интеграций посылают информацию об авторизации пользователя.

*db_config.json*

Пример:

```
{
    "connection_string": "root:root@tcp(127.0.0.1:3306)/student_project_management?parseTime=true",
    "singular_table": true
}
```

Где указываются настройки подключения к бд (строка подключения и настройки бд). Здесь нужно поменять только tcp адрес бд, если он другой.

А также создать файлы данных авторизации для сервисов интеграций и бота:

*credentials.json* 

Пример: 

```
{
    "web": {
        "client_id": "???,
        "project_id": "???",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_secret": "???",
        "redirect_uris": [
            "http://localhost:8080/api/v1/auth/integration/access/googlecalendar",
            "http://localhost:8080/api/v1/auth/integration/access/googledrive"
        ]
    }
}
```
Здесь указываются данные для интеграций с Google, этот файл автоматически сгенерирует Google при настройке проекта:

1. Включить API Google Drive и Calendar (https://developers.google.com/drive/api/quickstart/js#enable_the_api)
2. Настроить окно авторизации в Google (https://developers.google.com/drive/api/quickstart/js#configure_the_oauth_consent_screen)
3. Создать данные авторизации для сервера, где указать Authorized redirect URIs как в "redirect_uris" выше (**если надо поменять адрес**!) (https://developers.google.com/workspace/guides/create-credentials#oauth-client-id)

*credentials_github.json*

Пример:

```
{
    "web": {
        "client_id": "???",
        "app_id": "???",
        "auth_uri": "https://github.com/login/oauth/authorize",
        "token_uri": "https://github.com/login/oauth/access_token",
        "client_secret": "???",
        "redirect_uris": [
            "http://localhost:8080/auth/integration/access/github"
        ]
    }
}
```

Для получения client_id, app_id и client_secret созадется приложение GitHub по инструкции: https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/registering-a-github-app

Для Homepage URL можно указать адрес frontend, но в целом не обязательно

Для Callback URL обязательно указать как "redirect_uris" выше (**если надо поменять адрес!**) 

**Остальное не менять!**

*credentials_bot.json*

Пример:

```
{
    "telegram_bot_token": "???"
}
```

Вставить токен бота, который будет отправлять запросы на сервер.

> Все файлы должны находиться в папке кода запуска приложения (/web_server/cmd/web_app)!

#### Создание бд

В папке database/migrations хранятся миграции базы данных, которые создают актуальную версию бд. (для корректной работы лучше создать пустую бд с желанным именем).

При дальнейшем изменении бд именно сюда добавляются изменения.

Для прогонки и добавлении миграций использовалось go migrate CLI https://github.com/golang-migrate/migrate/tree/master/cmd/migrate 

### Windows (+Linux?)

Для запуска приложения локально требуется установить следующее: 
* Go версии 1.22 и выше
* MySQL последней версии (либо в Docker)
  
Сначала скачиваются все зависимости `go mod download`

Для запуска сервера без сборки использовать команду `go run ./web_app.go`

Для сборки использовать команду `go build -o ./web_app.exe ./`

