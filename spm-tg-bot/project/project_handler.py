"""
project_handler - Модуль для работы с проектами пользователя
"""
from datetime import datetime, timedelta
import telebot
from requests import RequestException

from bot.bot import CLIENT_URL
from project.project_service import get_projects, \
    get_project_commits, get_project_details, get_project_statistics, \
    add_project
from menu.menu_handler import show_main_menu
from student.student_service import get_students
from student.student_handler import handle_student_name
from integration.integration_handler import get_repohub


def projects_handler_init(bot):
    """Хендлер init"""

    @bot.message_handler(func=lambda message: message.text == "Мои проекты")
    def handle_projects_command(message):
        """Команда для обработки запроса на проекты."""
        handle_projects(message,bot)

    @bot.message_handler(func=lambda message: message.text == "Добавить проект")
    def new_project(message):
        """Хендлер команды Добавить проект"""
        students = get_students()

        if not students:
            bot.send_message(
                message.chat.id,
                """Нет доступных студентов для выбора.
    Вы можете добавить нового студента. Введите имя нового студента:""",
            )
            bot.register_next_step_handler(message, handle_student_name)
            return
        # Создаем клавиатуру для выбора студента
        keyboard = telebot.types.ReplyKeyboardMarkup(resize_keyboard=True)
        keyboard.add(telebot.types.KeyboardButton("Добавить нового студента..."))
        for student in students:
            keyboard.add(
                telebot.types.KeyboardButton(
                    student["surname"] + " " + student["name"] + " " + student["middlename"]
                )
            )  # Предполагаем, что у студента есть поле 'name'

        bot.send_message(
            message.chat.id, "Выберите студента для проекта:", reply_markup=keyboard
        )
        bot.register_next_step_handler(message, handle_student_selection, bot)

    @bot.callback_query_handler(func=lambda call: call.data.startswith("project_"))
    def handle_project_details(call):
        """Хендлер для просмотра информации о проекте"""
        project_id = call.data.split("_")[1]

        response = get_project_details(call.message.chat.id, project_id)  # Выполняем запрос

        if response.status_code == 200:
            project_details = response.json()

            details_message = format_project_details(project_details)  # Форматируем сообщение
            markup = create_markup(bot, project_details, call.message.chat.id)  # Создаем кнопки

            bot.send_message(
                call.message.chat.id,
                details_message,
                reply_markup=markup,
                parse_mode="Markdown",
            )
        else:
            bot.send_message(
                call.message.chat.id,
                f"Ошибка при получении деталей проекта: {response.status_code}",
            )
        bot.edit_message_reply_markup(call.message.chat.id, call.message.message_id)

    @bot.callback_query_handler(
        func=lambda call: call.data.startswith("statistics_project_")
    )
    def handle_project_statistics(call):
        """Хендлер для просмотра статистики по проекту"""
        project_id = call.data.split("_")[2]

        response = get_project_statistics(call.message.chat.id,project_id)  # Выполняем запрос

        if response.status_code == 200:
            statistics = response.json()
            stats_message = format_statistics_message(statistics)  # Форматируем сообщение
            bot.send_message(call.message.chat.id, stats_message, parse_mode="Markdown")
        else:
            bot.send_message(
                call.message.chat.id,
                f"Ошибка при получении статистики проекта: {response.status_code}",
            )

    @bot.callback_query_handler(func=lambda call: call.data.startswith("commits_project_"))
    def handle_project_commits(call):
        """Хендлер для просмотра коммитов по проекту"""
        project_id = call.data.split("_")[2]
        current_time = datetime.utcnow() - timedelta(days=30)
        month_ago = current_time.replace(hour=0, minute=0, second=0, microsecond=0)

        iso_format_time = month_ago.strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"

        response = get_project_commits(call.message.chat.id, project_id, iso_format_time)  # Выполняем запрос
        if response.status_code == 200:
            commits_data = response.json()
            commits = commits_data.get("commits", [])

            if commits:
                commits_message = "*Коммиты проекта:*\n\n"
                for commit in commits:
                    commits_message += format_commit_message(commit)

                bot.send_message(call.message.chat.id, commits_message, parse_mode="Markdown")
            else:
                bot.send_message(call.message.chat.id, "Коммиты отсутствуют.")
        else:
            bot.send_message(
                call.message.chat.id,
                f"Ошибка при получении коммитов проекта: {response.status_code}",
            )


def format_commit_message(commit):
    """Форматирует сообщение о коммите."""
    commit_sha = commit.get("commit_sha", "Не указано")
    message = commit.get("message", "Не указано")
    date_created = commit.get("date_created", "Не указано")
    created_by = commit.get("created_by", "Не указано")
    formatted_date = datetime.fromisoformat(date_created[:-1]).strftime("%Y-%m-%d %H:%M:%S")
    return (
        f"🔹 *SHA:* {commit_sha}\n"
        f"📝 *Сообщение:* {message}\n"
        f"📅 *Дата создания:* {formatted_date}\n"
        f"👤 *Создано пользователем:* {created_by}\n\n"
    )


def format_grades(grades):
    """Форматирует сообщение с оценками."""
    defence_grade = grades.get("defence_grade", "Нет оценки")
    supervisor_grade = grades.get("supervisor_grade", "Нет оценки")
    final_grade = grades.get("final_grade", "Нет оценки")
    supervisor_review = grades.get("supervisor_review", {})
    grades_message = (
        "*Оценки:*\n"
        f"🎓 *Защита:* {defence_grade}\n"
        f"👨‍🏫 *Оценка руководителя:* {supervisor_grade}\n"
        f"🏆 *Итоговая оценка:* {final_grade}\n\n"
    )
    if supervisor_review:
        review_criterias = supervisor_review.get("criterias", [])
        if review_criterias:
            grades_message += "*Критерии оценки:*\n"
            for criteria in review_criterias:
                criteria_name = criteria.get("criteria", "Не указано")
                criteria_grade = criteria.get("grade", "Не указано")
                criteria_weight = criteria.get("weight", "Не указано")
                grades_message += f"- {criteria_name}:"
                grades_message += f" Оценка {criteria_grade} (Вес: {criteria_weight})\n"

    return grades_message


def format_statistics_message(statistics):
    """Форматирует сообщение со статистикой проекта."""
    total_meetings = statistics.get("total_meetings", 0)
    total_tasks = statistics.get("total_tasks", 0)
    tasks_done = statistics.get("tasks_done", 0)
    tasks_done_percent = statistics.get("tasks_done_percent", 0)

    stats_message = (
        "*Статистика по проекту:*\n\n"
        f"📅 *Общее количество встреч:* {total_meetings}\n"
        f"📋 *Общее количество задач:* {total_tasks}\n"
        f"✅ *Завершенные задачи:* {tasks_done} ({tasks_done_percent}%)\n\n"
    )

    grades = statistics.get("grades", {})
    if grades:
        stats_message += format_grades(grades)
    else:
        stats_message += "Оценки отсутствуют.\n"
    return stats_message


def format_project_details(project_details):
    """Форматирует детали проекта для отправки пользователю."""
    students = project_details["students"]
    print(students)
    student_str = ""
    for student in students:
        student_str = student_str + f"{student['surname']} {student['name']} {student['middlename']}, {student['cource']} курс \n"
    theme = project_details["theme"]
    details_message = (
            "*Тема:* "
            + theme
            + "\n"
            + "*Год:* "
            + str(project_details["year"])
            + "\n"
            + "*Студенты:* "
            + student_str
            + "\n"
            + "*Статус проекта:* "
            + project_details["status"]
            + "\n"
            + "*Стадия работы:* "
            + project_details["stage"]
            + "\n"
            + "*Ссылка на Google Drive:* [Перейти к папке]("
            + project_details["cloud_folder_link"]
            + ")\n"
    )
    return details_message


def create_project_card(project):
    """Создает текст карточки проекта."""
    return f"""Тема: {project['theme']}\nГод: {project['year']}"""


def create_markup(bot, project_details, chat_id):
    """Создает кнопки для взаимодействия с проектом."""
    markup = telebot.types.InlineKeyboardMarkup()
    button1 = telebot.types.InlineKeyboardButton(
        "Статистика", callback_data=f"statistics_project_{project_details['id']}"
    )
    button2 = telebot.types.InlineKeyboardButton(
        "Коммиты", callback_data=f"commits_project_{project_details['id']}"
    )
    button3 = telebot.types.InlineKeyboardButton(
        "Задания", callback_data=f"tasks_project_{project_details['id']}"
    )
  #  button4 = telebot.types.InlineKeyboardButton(
   #     "Назначить задание",
     #   callback_data=f"add_task_project_{project_details['id']}",
    #)

    if get_repohub(chat_id) is not None:
        markup.add(button1, button2, button3)
    else:
        # Если репозиторий не подключен, добавляем только доступные кнопки
        bot.send_message(
            chat_id,
            f"""Вам недоступны коммиты проекта, подключите интеграцию
с Github в личном кабинете в веб-приложении: <a href='{CLIENT_URL}/profile/integrations'>
Перейти к интеграциям</a>""",
            parse_mode="HTML",
        )
        markup.add(button1, button3, button4)

    return markup


def handle_student_selection(message, bot):
    """функция для выбора студента"""
    student_name = message.text
    if student_name == "Добавить нового студента...":
        bot.send_message(message.chat.id, "Введите имя нового студента:")
        bot.register_next_step_handler(message, handle_student_name)
        return
    # Здесь вы можете добавить проверку на наличие выбранного студента в списке
    # Например, если у вас есть список студентов в виде словаря
    students = get_students()

    selected_student = next(
        (s for s in students
         if (s["surname"] + " " + s["name"] + " " + s["middlename"]) == student_name), None
    )

    if selected_student is None:
        bot.send_message(
            message.chat.id,
            "Выбранный студент не найден. Пожалуйста, попробуйте снова.",
        )
        show_main_menu(message.chat.id)
        return

    bot.send_message(message.chat.id, "Введите тему нового проекта:")
    bot.register_next_step_handler(
        message, lambda msg: handle_project_theme(msg, bot, selected_student)
    )


def handle_project_theme(message, bot, student):
    """функция для выбора темы проекта"""
    project_theme = message.text
    bot.send_message(message.chat.id, "Введите год проекта (число):")
    bot.register_next_step_handler(
        message, lambda msg: handle_project_year(msg, bot, student, project_theme)
    )


def handle_project_year(message, bot, student, project_theme):
    """функция для выбора года проекта"""
    try:
        project_year = int(message.text)
        bot.send_message(message.chat.id, "Введите владельца репозитория (логин):")
        bot.register_next_step_handler(
            message,
            lambda msg: handle_repo_owner(msg, bot, student, project_theme, project_year),
        )
    except ValueError:
        bot.send_message(
            message.chat.id, "Год должен быть числом. Пожалуйста, попробуйте снова."
        )
        handle_project_year(message, bot, student, project_theme)


def handle_repo_owner(message, bot, student, project_theme, project_year):
    """функция для выбора владельца проекта"""
    repo_owner = message.text
    project_info = {
        "repo_owner": repo_owner,
        "student": student,
        "project_theme": project_theme,
        "project_year": project_year
    }
    bot.send_message(message.chat.id, "Введите имя репозитория:")
    bot.register_next_step_handler(
        message,
        lambda msg: handle_repository_name(
            msg, bot, project_info
        ),
    )


def handle_repository_name(message, bot, project_info):
    """Обработчик для ввода имени репозитория."""
    repository_name = message.text

    response_message = add_project( message.chat.id,
        project_info["project_theme"], project_info["student"]["id"],
        project_info["project_year"], project_info["repo_owner"], repository_name
    )

    bot.send_message(message.chat.id, response_message)

    # Вернуться в главное меню после добавления проекта
    show_main_menu(message.chat.id)


def handle_projects(message, bot):
    """Хендлер проектов"""
    try:
        projects = get_projects(message.chat.id)

        if projects:  # Проверяем, есть ли проекты в списке
            for project in projects:
                project_card = create_project_card(project)

                # Создаем кнопку для каждого проекта
                markup = telebot.types.InlineKeyboardMarkup()
                button = telebot.types.InlineKeyboardButton(
                    "Подробнее", callback_data=f"project_{project['id']}"
                )
                markup.add(button)

                # Отправляем сообщение с карточкой и кнопкой
                bot.send_message(message.chat.id, project_card, reply_markup=markup)
        else:
            bot.send_message(message.chat.id, "У вас нет проектов.")
    except RequestException as e:
        bot.send_message(message.chat.id, f"Ошибка: {str(e)}")
