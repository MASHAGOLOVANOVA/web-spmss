"""
professor_handler - Модуль для работы с профессорами

Этот модуль работает с API
"""

from telebot import types
from bot.bot import user_sessions
from professor.professor_service import get_professors
from application.application_service import submit_supervision_request, get_applications


def professor_handler_init(bot):
    """Хендлер init"""

    @bot.message_handler(func=lambda message: message.text == "Подать заявку на научное руководство")
    def handle_apply_for_supervision(message):
        """Обрабатывает нажатие кнопки 'Подать заявку на научное руководство'."""
        user_id = message.chat.id  # Уникальный идентификатор пользователя

        # Проверяем, существует ли сессия для данного пользователя
        if (user_id not in user_sessions) or (user_sessions[user_id].is_professor):
            bot.send_message(user_id, "Сначала выполните вход.")
            return

        # Получаем список профессоров
        professors = get_professors(user_id)
        print(professors)
        applications = get_applications(user_id)
        prof_applied = []
        for application in applications:
            prof_applied.append(application["professor_id"])
        has_buttons = False
        if professors:
            # Создаем клавиатуру для выбора профессора
            keyboard = types.InlineKeyboardMarkup()
            for professor in professors:
                if professor['id'] not in prof_applied:
                    print(professor['id'])

                    button = types.InlineKeyboardButton(
                        text=professor['name'],
                        callback_data=f"apply_{professor['id']}"  # Уникальный идентификатор профессора
                    )
                    keyboard.add(button)
                    has_buttons = True
            if has_buttons:
                response_message = "Вот список профессоров, к которым вы можете подать заявку на научное руководство:"
                bot.send_message(user_id, response_message, reply_markup=keyboard)
            else:
                bot.send_message(user_id, "Нет профессоров, которым Вы еще не отправляли заявки.")
        else:
            bot.send_message(user_id, "Профессоров нет.")

    @bot.callback_query_handler(func=lambda call: call.data.startswith("apply_"))
    def handle_professor_selection(call):
        """Обрабатывает выбор профессора для подачи заявки на научное руководство."""
        professor_id = call.data.split("_")[1]  # Извлекаем ID профессора
        print(professor_id)
        response = submit_supervision_request(call.message.chat.id, professor_id)
        print(response)
        bot.send_message(call.message.chat.id, f"Вы подали заявку на научное руководство к профессору.")

    @bot.message_handler(func=lambda message: message.text == "Мои заявки")
    def handle_applications(message):
        """Обрабатывает нажатие кнопки 'Подать заявку на научное руководство'."""
        user_id = message.chat.id  # Уникальный идентификатор пользователя

        # Проверяем, существует ли сессия для данного пользователя
        if (user_id not in user_sessions) or (user_sessions[user_id].is_professor):
            bot.send_message(user_id, "Сначала выполните вход.")
            return

        # Получаем список профессоров
        applications = get_applications(user_id)
        if applications:
            print(applications)
            if applications:
                response_message = "Перечень заявок:\n"
                for application in applications:
                    # Определяем статус заявки
                    if application['status'] == 'true':
                        status_text = "Одобрена"
                    elif application['status'] == 'null':
                        status_text = "На рассмотрении"
                    else:
                        status_text = "Отклонена"

                    # Форматируем сообщение для каждой заявки
                    response_message += (
                        f"Профессор: {application['professor_name']}\n"
                        f"Статус: {status_text}\n"
                        "-------------------------\n"
                    )

                # Отправляем сообщение с перечнем заявок
                bot.send_message(message.chat.id, response_message)
            else:
                bot.send_message(message.chat.id, "Нет заявок.")
        else:
            bot.send_message(message.chat.id, "Нет заявок.")