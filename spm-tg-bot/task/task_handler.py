"""
project_handler - Модуль для работы с задачами
"""
from datetime import datetime
from requests import RequestException
from task.task_service import get_project_tasks, add_task_to_project


def task_handler_init(bot):
    """Хендлер init"""

    @bot.callback_query_handler(func=lambda call: call.data.startswith("add_task_project_"))
    def handle_project_new_task(call):
        """Хендлер для добавления задачи"""
        project_id = call.data.split("_")[3]

        bot.send_message(call.message.chat.id, "Введите название задачи:")
        bot.register_next_step_handler(call.message, handle_task_name, bot, project_id)

    @bot.callback_query_handler(func=lambda call: call.data.startswith("tasks_project_"))
    def handle_project_tasks(call):
        """Хендлер для получения задач проекта"""
        project_id = call.data.split("_")[2]

        try:
            tasks = get_project_tasks(call.message.chat.id, project_id)  # Выполняем запрос

            tasks_message = format_tasks_message(tasks)  # Форматируем сообщение
            bot.send_message(call.message.chat.id, tasks_message, parse_mode="Markdown")

        except RequestException as e:
            bot.send_message(call.message.chat.id, str(e))


def format_tasks_message(tasks):
    """Форматирует сообщение о задачах для отправки пользователю."""
    if not tasks:
        return "Задания отсутствуют."

    tasks_message = "*Задания по проекту:*\n\n"
    for task in tasks:
        task_id = task.get("id", "Не указано")
        task_name = task.get("name", "Не указано")
        task_description = task.get("description", "Не указано")
        task_dead = task.get("deadline", "Не указано")
        task_status = task.get("status", "Не указано")
        cloud_folder_link = task.get("cloud_folder_link", "Не указано")

        formatted_deadline = (datetime.fromisoformat(task_dead[:-1])
                              .strftime("%Y-%m-%d %H:%M:%S"))

        tasks_message += f"🔹 *ID:* {task_id}\n"
        tasks_message += f"📝 *Название:* {task_name}\n"
        tasks_message += f"📜 *Описание:* {task_description}\n"
        tasks_message += f"📅 *Дедлайн:* {formatted_deadline}\n"
        tasks_message += f"🔄 *Статус:* {task_status}\n"
        tasks_message += f"📂 *Ссылка на папку:* [Google Drive]({cloud_folder_link})\n\n"

    return tasks_message


def handle_task_name(message, bot, project_id):
    """функция для получения названия задачи"""
    task_name = message.text  # Получаем название задачи

    bot.send_message(message.chat.id, "Введите описание задачи:")
    bot.register_next_step_handler(
        message, handle_task_description, bot, project_id, task_name
    )


def handle_task_description(message, bot, project_id, task_name):
    """функция для получения описания задачи"""
    task_description = message.text  # Получаем описание задачи

    bot.send_message(
        message.chat.id, "Введите дедлайн задачи (в формате dd.mm.YYYY HH:MM):"
    )
    bot.register_next_step_handler(
        message, handle_task_deadline, bot, project_id, task_name, task_description
    )


def handle_task_deadline(message, bot, project_id, task_name, task_description):
    """Функция для получения дедлайна задачи и добавления задачи в проект."""
    task_deadline_input = message.text  # Получаем дедлайн задачи
    try:
        deadline_datetime = datetime.strptime(task_deadline_input, "%d.%m.%Y %H:%M")

        new_task_data = {
            "name": task_name,
            "description": task_description,
            "deadline": deadline_datetime.isoformat() + "Z",  # Преобразуем в строку ISO 8601
        }

        response = add_task_to_project(message.chat.id, project_id, new_task_data)  # Выполняем запрос

        if response.status_code == 200:
            bot.send_message(message.chat.id, "Задача успешно добавлена!")
        else:
            bot.send_message(message.chat.id, f"Ошибка при добавлении задачи: {response.text}")

    except ValueError:
        bot.send_message(
            message.chat.id,
            "Неверный формат даты. Пожалуйста, используйте формат dd.mm.YYYY HH:MM.",
        )
        bot.register_next_step_handler(
            message, bot, handle_task_deadline, project_id, task_name, task_description
        )
