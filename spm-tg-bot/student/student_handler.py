"""
project_handler - Модуль для работы со студентами
"""
import telebot
from bot.bot import bot
from menu.menu_handler import show_main_menu
from student.student_service import add_student
from ed_programme.ed_prog_service import get_educational_programmes


def handle_student_name(message):
    """функция для ввода имени студента"""
    student_name = message.text
    bot.send_message(message.chat.id, "Введите фамилию нового студента:")
    bot.register_next_step_handler(
        message, lambda msg: handle_student_surname(msg, student_name)
    )


def handle_student_surname(message, student_name):
    """функция для ввода фамилии студента"""
    student_surname = message.text
    bot.send_message(message.chat.id, "Введите отчество нового студента:")
    bot.register_next_step_handler(
        message, lambda msg: handle_student_middlename(msg, student_name, student_surname)
    )


def handle_student_middlename(message, student_name, student_surname):
    """функция для ввода отчества студента"""
    student_middlename = message.text
    bot.send_message(message.chat.id, "Введите курс нового студента (число):")
    bot.register_next_step_handler(
        message,
        lambda msg: handle_student_course(
            msg, student_name, student_surname, student_middlename
        ),
    )


def handle_student_course(message, student_name, student_surname, student_middlename):
    """функция для ввода курса студента"""
    try:
        student_course = int(message.text)
        educational_programmes = get_educational_programmes(message.chat.id)
        if not educational_programmes:
            bot.send_message(
                message.chat.id,
                "Нет доступных образовательных программ. Попробуйте позже.",
            )
            show_main_menu(message.chat.id)
            return

        # Создаем клавиатуру для выбора образовательной программы
        keyboard = telebot.types.ReplyKeyboardMarkup(resize_keyboard=True)
        for programme in educational_programmes:
            keyboard.add(telebot.types.KeyboardButton(programme["name"]))

        bot.send_message(
            message.chat.id,
            "Выберите образовательную программу:",
            reply_markup=keyboard,
        )
        bot.register_next_step_handler(
            message,
            lambda msg: handle_student_programme(
                msg, student_name, student_surname, student_middlename, student_course
            ),
        )
    except ValueError:
        bot.send_message(
            message.chat.id, "Курс должен быть числом. Пожалуйста, попробуйте снова."
        )
        handle_student_course(message, student_name, student_surname, student_middlename)


def handle_student_programme(message, student_name,
                             student_surname, student_middlename, student_course):
    """Функция для ввода уч программы студента."""
    selected_programme_name = message.text
    selected_programme = get_selected_programme(message.chat.id, selected_programme_name)

    if selected_programme is None:
        bot.send_message(
            message.chat.id,
            "Выбранная программа не найдена. Пожалуйста, попробуйте снова.",
        )
        show_main_menu(message.chat.id)
        return

    # Создаем нового студента
    new_student_data = {
        "name": student_name,
        "surname": student_surname,
        "middlename": student_middlename,
        "cource": student_course,
        "educationalprogrammeid": selected_programme["id"],
    }

    response = add_student(new_student_data)

    if response:
        bot.send_message(
            message.chat.id,
            f'Студент "{student_name} {student_surname}" успешно добавлен!',
        )
    else:
        bot.send_message(
            message.chat.id,
            "Ошибка при добавлении студента. Попробуйте снова.",
        )
    show_main_menu(message.chat.id)


def get_selected_programme(id, selected_programme_name):
    """Получает выбранную образовательную программу по имени."""
    educational_programmes = get_educational_programmes(id)
    return next(
        (ep for ep in educational_programmes if ep["name"] == selected_programme_name),
        None,
    )
