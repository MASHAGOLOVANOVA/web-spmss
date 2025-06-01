"""
menu-handler - Модуль для обработки главного меню
"""
import telebot.types
from bot.bot import bot, CLIENT_URL
from integration.integration_handler import get_google_planner


def show_main_menu(chat_id):
    """функция открытия главного меню"""
    # Создаем главное меню
    keyboard = telebot.types.ReplyKeyboardMarkup(resize_keyboard=True)
    button_projects = telebot.types.KeyboardButton("Мои проекты")
    button_meetings = telebot.types.KeyboardButton("Мои встречи")

    has_planner = get_google_planner(chat_id)
    if has_planner is not None:
        keyboard.add(button_projects, button_meetings)
    else:
        bot.send_message(
            chat_id,
            f"""К сожалению Вам недоступно расписание встреч!\n
Чтобы пользоваться расписанием, подключите Google Calendar из веб-приложения:
\n{CLIENT_URL}/profile/integrations""",
        )
        keyboard.add(button_projects)

    bot.send_message(chat_id, "Выберите действие:", reply_markup=keyboard)


def show_student_main_menu(chat_id):
    """функция открытия главного меню"""
    # Создаем главное меню
    keyboard = telebot.types.ReplyKeyboardMarkup(resize_keyboard=True)
    button_add_supervisor = telebot.types.KeyboardButton("Подать заявку на научное руководство")
    button_meetings = telebot.types.KeyboardButton("Мои встречи")
    button_applications = telebot.types.KeyboardButton("Мои заявки")
    button_add_meeting = telebot.types.KeyboardButton("Записаться на консультацию")  # Новая кнопка

    keyboard.add(button_add_supervisor, button_applications, button_meetings, button_add_meeting)
    bot.send_message(chat_id, "Выберите действие:", reply_markup=keyboard)
