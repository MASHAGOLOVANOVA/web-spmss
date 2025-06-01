"""
auth_handler - Модуль для обработки аутентификации пользователей.

Этот модуль содержит функции и классы, необходимые для управления
аутентификацией пользователей в приложении.
"""
import telebot
from requests.exceptions import RequestException
from bot.bot import CLIENT_URL, user_sessions, BOT_TOKEN
from auth.auth_service import (send_verification_request, get_account, send_student_verification_request,
                               get_student_account, register_student)
from menu.menu_handler import show_main_menu, show_student_main_menu
from integration.integration_handler import get_cloud_drive
from session_manager import SessionManager


def auth_handler_init(bot):
    """Хендлер init"""

    @bot.message_handler(content_types=["contact"])
    def handle_contact(message):
        """Хендлер contact"""
        contact = message.contact
        phone_number = contact.phone_number  # Получаем номер телефона
        if not phone_number.startswith('+'):
            phone_number = f'+{phone_number}'
        bot.send_message(message.chat.id, f"Спасибо! Ваш номер телефона: {phone_number}")

        # Запрашиваем роль (студент или преподаватель)
        keyboard = telebot.types.ReplyKeyboardMarkup(one_time_keyboard=True)
        keyboard.add('Студент', 'Преподаватель')

        bot.send_message(
            message.chat.id,
            "Пожалуйста, выберите вашу роль:",
            reply_markup=keyboard,
        )

        # Регистрируем следующий шаг для обработки выбора роли
        bot.register_next_step_handler(message, handle_role_selection, phone_number)

    def handle_role_selection(message, phone_number):
        """Хендлер для обработки выбора роли"""
        role = message.text
        if role in ['Студент', 'Преподаватель']:
            credentials = {"phone_number": phone_number}
            if role == 'Преподаватель':
                verify_number(bot, message, credentials)
            else:
                credentials = {"phone_number": phone_number}
                if not verify_student_number(bot, message, credentials):
                # Запрашиваем дополнительную информацию для студента
                    bot.send_message(message.chat.id, "Пожалуйста, введите ваше имя:")
                    bot.register_next_step_handler(message, handle_first_name, phone_number)
        else:
            bot.send_message(message.chat.id, "Пожалуйста, выберите 'Студент' или 'Преподаватель'.")
            bot.register_next_step_handler(message, handle_role_selection, phone_number)

    def handle_first_name(message, phone_number):
        """Хендлер для обработки имени"""
        first_name = message.text
        bot.send_message(message.chat.id, "Пожалуйста, введите вашу фамилию:")
        bot.register_next_step_handler(message, handle_last_name, phone_number, first_name)

    def handle_last_name(message, phone_number, first_name):
        """Хендлер для обработки фамилии"""
        last_name = message.text
        bot.send_message(message.chat.id, "Пожалуйста, введите ваше отчество:")
        bot.register_next_step_handler(message, handle_patronymic, phone_number, first_name, last_name)

    def handle_patronymic(message, phone_number, first_name, last_name):
        """Хендлер для обработки отчества"""
        patronymic = message.text
        bot.send_message(message.chat.id, "Пожалуйста, введите ваше направление подготовки:")
        bot.register_next_step_handler(message, handle_major, phone_number, first_name, last_name, patronymic)

    def handle_major(message, phone_number, first_name, last_name, patronymic):
        """Хендлер для обработки направления подготовки"""
        major = message.text
        bot.send_message(message.chat.id, "Пожалуйста, введите ваш курс:")
        bot.register_next_step_handler(message, handle_course, phone_number, first_name, last_name, patronymic,
                                       major)

    def handle_course(message, phone_number, first_name, last_name, patronymic, major):
        """Хендлер для обработки курса"""
        course = message.text
        bot.send_message(message.chat.id, "Пожалуйста, введите ваш университет:")
        bot.register_next_step_handler(message, handle_university, phone_number, first_name, last_name, patronymic,
                                       major, course)

    def handle_university(message, phone_number, first_name, last_name, patronymic, major, course):
        """Хендлер для обработки университета"""
        university = message.text
        bot.send_message(message.chat.id,
                         f"Спасибо! Ваши данные:\nНомер телефона: {phone_number}\nИмя: {first_name}\nФамилия: {last_name}\nОтчество: {patronymic}\nНаправление подготовки: {major}\nУниверситет: {university}")

        # Создаем данные для отправки на сервер
        credentials = {
            "login": phone_number,
            "name": first_name,
            "surname": last_name,
            "middlename": patronymic,
            "ed_prog_name": major,
            "university": university,
            "course": int(course)
        }
        response = register_student(credentials)
        if response.status_code == 200:
            bot.send_message(message.chat.id, "Пользователь успешно создан!")
            credentials = {"phone_number": phone_number}
            verify_student_number(bot, message, credentials)
        else:
            bot.send_message(message.chat.id, "Произошла ошибка при создании пользователя!")


def verify_number(bot, message, credentials):
    """Функция для поиска номера в системе"""
    try:
        bot.send_message(message.chat.id, "Проверяем регистрацию...")

        response = send_verification_request(credentials)  # Отправляем запрос

        handle_verification_response(bot, message, response)  # Обрабатываем ответ

    except RequestException as e:
        bot.send_message(message.chat.id, f"Ошибка сети: {str(e)}")


def verify_student_number(bot, message, credentials):
    """Функция для поиска номера в системе"""
    try:
        bot.send_message(message.chat.id, "Проверяем регистрацию...")

        response = send_student_verification_request(credentials)  # Отправляем запрос
        print(response)
        return handle_student_verification_response(bot, message, response)  # Обрабатываем ответ

    except RequestException as e:
        bot.send_message(message.chat.id, f"Ошибка сети: {str(e)}")


def handle_student_verification_response(bot, message, response):
    """Обрабатывает ответ от API и выполняет соответствующие действия."""
    if response.status_code == 200:
        bot.send_message(message.chat.id, "Мы Вас нашли!")

        response_data = response.json()  # Используем response.json()

        # Обновляем session_token, если он присутствует в ответе
        if "session_token" in response_data:
            session_manager = SessionManager()
            session_manager.set_session_token(response_data["session_token"])
            session_manager.set_is_professor(False)
            session_manager.set_bot_token(BOT_TOKEN)

            user_sessions[message.chat.id] = session_manager
            student = get_student_account(message.chat.id)
            print(student)
            bot.send_message(message.chat.id, f'Здравствуйте, {student["name"]}!')
            show_student_main_menu(message.chat.id)
            return True
    return False


def handle_verification_response(bot, message, response):
    """Обрабатывает ответ от API и выполняет соответствующие действия."""
    if response.status_code == 200:
        bot.send_message(message.chat.id, "Мы Вас нашли!")

        response_data = response.json()  # Используем response.json()

        # Обновляем session_token, если он присутствует в ответе
        if "session_token" in response_data:
            session_manager = SessionManager()
            session_manager.set_session_token(response_data["session_token"])
            session_manager.set_is_professor(True)
            session_manager.set_bot_token(BOT_TOKEN)
            user_sessions[message.chat.id] = session_manager
            professor = get_account(message.chat.id)
            print(professor)
            bot.send_message(message.chat.id, f'Здравствуйте, {professor["name"]}!')
            cloud_drive = get_cloud_drive(message.chat.id)
            if cloud_drive is not None:
                show_main_menu(message.chat.id)
            else:
                bot.send_message(
                    message.chat.id,
                    f"""Чтобы воспользоваться функциями бота подключите
Google Drive из веб-приложения.""",
                )
        else:
            print("session_token не найден в ответе")
    else:
        bot.send_message(
            message.chat.id,
            "Произошла ошибка при поиске пользователя по номеру телефона.",
        )
