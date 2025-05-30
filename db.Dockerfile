FROM mysql:latest

ENV MYSQL_ROOT_PASSWORD=root
ENV MYSQL_DATABASE=student_project_management
ENV MYSQL_USER=owner
ENV MYSQL_PASSWORD=root


# Очищаем папку и копируем файлы в одном RUN-шаге
RUN find /docker-entrypoint-initdb.d/ -type f -delete
COPY --chown=mysql:mysql database/migrations/up/ /docker-entrypoint-initdb.d/