"""
meeting-handler - Модуль для обработки встреч пользователя
"""
from datetime import timedelta, datetime, timezone
import telebot
from telebot import types
from telegram.constants import ParseMode

from bot.bot import user_sessions
from meeting.meeting_service import get_meetings, add_meeting, get_professor_slots, choose_slot, cancel_meeting, reschedule_meeting
from menu.menu_handler import show_main_menu
from application.application_service import get_applications

days_translation = {
    "Monday": "Понедельник",
    "Tuesday": "Вторник",
    "Wednesday": "Среда",
    "Thursday": "Четверг",
    "Friday": "Пятница",
    "Saturday": "Суббота",
    "Sunday": "Воскресенье",
}


def meeting_handler_init(bot):
    """Хендлер init"""

    @bot.message_handler(func=lambda message: message.text == "Мои встречи")
    def handle_meetings(message):
        prof = user_sessions[message.chat.id].is_professor
        print("is professor", prof)
        if prof:
            meetings = get_meetings(message.chat.id, True)
        else:
            meetings = get_meetings(message.chat.id, False)
        now = datetime.now(timezone.utc)
        meetings = [m for m in meetings if datetime.fromisoformat(m["end_time"].replace("Z", "+00:00")) >= now]

        if not meetings:
            bot.send_message(message.chat.id, "Нет предстоящих встреч")
            return
        if len(meetings) > 0:
            if prof:
                grouped_meetings = group_meetings_by_day(meetings)
                for day, day_meetings in grouped_meetings.items():
                    # Отправляем заголовок дня
                    bot.send_message(message.chat.id, f"*{day}*", parse_mode="Markdown")

                    # Отправляем каждую встречу с кнопками
                    for meeting in day_meetings:
                        send_meeting_with_buttons(bot, message.chat.id, meeting)
            else:
                response = format_meetings_student(group_meetings_by_day_student(meetings))
                for d in response:
                    bot.send_message(message.chat.id, d, parse_mode=ParseMode.MARKDOWN)

        else:
            bot.send_message(message.chat.id, "Встречи не назначены")

    @bot.callback_query_handler(
        func=lambda call: call.data.startswith("add_meeting_project_")
    )
    def handle_project_new_meeting(call):
        """Хендлер для добавления встречи по проекту"""
        project_id = call.data.split("_")[3]
        student_id = call.data.split("_")[5]

        bot.send_message(call.message.chat.id, "Введите название встречи:")
        bot.register_next_step_handler(
            call.message, handle_meeting_name, bot, project_id, student_id
        )

    @bot.message_handler(func=lambda message: message.text == "Записаться на консультацию")
    def handle_choose_slot(message):
        applications = get_applications(message.chat.id)
        has_buttons = False
        unique_professors = {}
        if applications:
            # Collect unique professors
            for application in applications:
                professor_id = application["professor_id"]
                professor_name = application["professor_name"]
                if professor_id not in unique_professors and application["status"] == "true":
                    unique_professors[professor_id] = professor_name  # Store unique professor

            keyboard = types.InlineKeyboardMarkup()
            for prof_id, prof_name in unique_professors.items():
                button = types.InlineKeyboardButton(
                    text=unique_professors[prof_id],
                    callback_data=f"apply_consultation_{prof_id}"
                )
                keyboard.add(button)
                has_buttons = True
            if has_buttons:
                response_message = "Выберите профессора для записи на консультацию:"
                bot.send_message(message.chat.id, response_message, reply_markup=keyboard)
            else:
                bot.send_message(message.chat.id, "Нет профессоров, которым Вы еще не отправляли заявки.")
        else:
            bot.send_message(message.chat.id, "Профессоров нет.")

    @bot.callback_query_handler(func=lambda call: call.data.startswith("apply_consultation_"))
    def handle_consultation_application(call):
        professor_id = call.data.split("_")[-1]

        slots = get_professor_slots(call.message.chat.id, professor_id)
        print(slots)
        if slots:
            keyboard = types.InlineKeyboardMarkup()  # Create an inline keyboard
            for slot in slots:
                # Create a button for each slot
                # Форматируем время для красивого отображения
                start_time = datetime.fromisoformat(slot['start_time'])
                end_time = datetime.fromisoformat(slot['end_time'])

                formatted_date = start_time.strftime("%d.%m.%Y")
                formatted_start = start_time.strftime("%H:%M")
                formatted_end = end_time.strftime("%H:%M")

                # Создаем текст кнопки
                button_text = (
                    f"📅 {formatted_date}\n"
                    f"🕒 {formatted_start}-{formatted_end}\n"
                    f"📝 {slot['description']}"
                )

                # Создаем кнопку
                button = types.InlineKeyboardButton(
                    text=button_text,
                    callback_data=f"book_slot_{slot['id']}"
                )
                keyboard.add(button)

            response_message = "Выберите доступный слот для записи на консультацию:"
            bot.send_message(call.message.chat.id, response_message,
                             reply_markup=keyboard)  # Send message with keyboard
        else:
            bot.send_message(call.message.chat.id, "Нет доступных слотов для этого профессора.")

    @bot.callback_query_handler(func=lambda call: call.data.startswith("book_slot_"))
    def handle_book_slot(call):
        slot_id = call.data.split("_")[-1]
        resp = choose_slot(call.message.chat.id, slot_id)
        if resp == 200:
            bot.send_message(call.message.chat.id, "Вы успешно записались на консультацию")
        else:
            bot.send_message(call.message.chat.id, "Произошла ошибка при записи на консультацию")

    @bot.callback_query_handler(func=lambda call: call.data.startswith(('cancel_', 'reschedule_')))
    def handle_meeting_actions(call):
        try:
            action, meeting_id = call.data.split('_')

            if action == "cancel":
                # Удаляем кнопки из сообщения
                bot.edit_message_reply_markup(
                    chat_id=call.message.chat.id,
                    message_id=call.message.message_id,
                    reply_markup=None
                )

                # Логика отмены встречи
                if cancel_meeting(call.message.chat.id, meeting_id):
                        bot.answer_callback_query(call.id, "Встреча отменена")
                        bot.edit_message_text(
                            chat_id=call.message.chat.id,
                            message_id=call.message.message_id,
                            text=f"{call.message.text}\n\n❌ *Встреча отменена*",
                            parse_mode="Markdown"
                        )

                else:
                    bot.answer_callback_query(call.id, "Ошибка отмены встречи")

            elif action == "reschedule":
                print(user_sessions[call.message.chat.id].reschedule_process())
                if user_sessions[call.message.chat.id].reschedule_process() is None:
                    user_sessions[call.message.chat.id].set_rescheduling(True)
                    bot.answer_callback_query(call.id, "Введите новую дату и время")
                    msg = bot.send_message(
                        call.message.chat.id,
                        f"Введите новую дату и время для встречи в формате ДД.ММ.ГГГГ ЧЧ:ММ\n"
                        f"Пример: 15.07.2023 14:30"
                    )
                    bot.register_next_step_handler(msg, process_reschedule_date, meeting_id)
                else:
                    bot.send_message(call.message.chat.id,"Вы уже переносите одну из встреч.")
        except Exception as e:
            print(f"Error handling meeting action: {e}")
            bot.answer_callback_query(call.id, "Произошла ошибка")

    def process_reschedule_date(message, meeting_id):
        try:
            # Парсим дату и время из сообщения
            new_datetime = datetime.strptime(message.text, "%d.%m.%Y %H:%M")
            # Форматируем в ISO формат для отправки в API
            new_datetime = new_datetime - timedelta(hours=5)
            iso_datetime = new_datetime.isoformat() + "Z"
            if reschedule_meeting(message.chat.id, meeting_id, iso_datetime):
                bot.send_message(
                    message.chat.id,
                    "✅ Встреча перенесена."
                )
            else:
                bot.send_message(message.chat.id, "❌ Ошибка переноса встречи")
            user_sessions[message.chat.id].set_rescheduling(None)

        except ValueError:
            user_sessions[message.chat.id].set_rescheduling(None)
            bot.send_message(message.chat.id, "⚠️Процесс переноса отменен. Неверный формат даты.")


def handle_meeting_name(message, bot, project_id, student_id):
    """функция для получения названия встречи"""
    name = message.text  # Получаем название

    bot.send_message(message.chat.id, "Введите описание встречи:")
    bot.register_next_step_handler(
        message, handle_meeting_description, bot, project_id, student_id, name
    )


def handle_meeting_description(message, bot, project_id, student_id, name):
    """функция для получения описания встречи"""
    desc = message.text  # Получаем название
    meeting_info = {
        "name": name,
        "description": desc,
        "project_id": project_id,
        "student_id": student_id
    }
    bot.send_message(message.chat.id, "Введите время встречи:")
    bot.register_next_step_handler(
        message, handle_meeting_time, bot, meeting_info
    )


def handle_meeting_time(message, bot, meeting_info):
    """функция для получения времени встречи"""
    time = message.text
    try:
        iso_time = (datetime.strptime(time, "%d.%m.%Y %H:%M")).isoformat()
        meeting_info["start_time"] = iso_time
        bot.send_message(
            message.chat.id,
            "Выберите формат встречи:",
            reply_markup=get_meeting_format_markup(),
        )
        bot.register_next_step_handler(
            message, handle_meeting_format, bot, meeting_info
        )
    except ValueError:
        bot.send_message(
            message.chat.id,
            "Неверный формат даты. Пожалуйста, используйте формат YYYY-MM-DD HH:MM.",
        )
        bot.register_next_step_handler(
            message, handle_meeting_time, bot, meeting_info
        )


def handle_meeting_format(message, bot, meeting_info):
    """Функция для получения формата встречи."""
    meeting_format = message.text  # Получаем формат встречи

    if meeting_format not in ["Онлайн", "Оффлайн"]:
        bot.send_message(
            message.chat.id,
            "Пожалуйста, выберите корректный формат встречи: Онлайн или Оффлайн.",
        )
        return  # Завершаем выполнение функции, если формат некорректный

    try:
        online = meeting_format == "Онлайн"  # Устанавливаем значение is_online
        # Формируем данные для новой встречи
        new_meeting_data = {
            "name": meeting_info["name"],
            "description": meeting_info["description"],
            "project_id": int(meeting_info["project_id"]),
            "student_participant_id": int(meeting_info["student_id"]),
            "is_online": online,
            "meeting_time": meeting_info["start_time"] + "Z",  # Преобразуем в строку ISO 8601
        }

        # Отправляем запрос на создание встречи
        if add_meeting(message.chat.id, new_meeting_data):
            bot.send_message(message.chat.id, "Встреча успешно добавлена!")

    except ValueError:
        bot.send_message(
            message.chat.id,
            "Неверный формат даты. Пожалуйста, используйте формат YYYY-MM-DD HH:MM.",
        )
    finally:
        show_main_menu(message.chat.id)


def get_meeting_format_markup():
    """функция для получения доски для выбора формата встречи"""
    markup = telebot.types.ReplyKeyboardMarkup(one_time_keyboard=True)
    button_online = telebot.types.KeyboardButton("Онлайн")
    button_offline = telebot.types.KeyboardButton("Оффлайн")
    markup.add(button_online, button_offline)
    return markup


def group_meetings_by_day(meetings):
    """функция для группировки встреч"""
    grouped = {}
    for meeting in meetings:
        start_time = datetime.fromisoformat(meeting["start_time"].replace("Z", "+00:00"))
        day = days_translation.get(start_time.strftime("%A"))  # Получаем день недели
        date = start_time.strftime("%d.%m.%Y")
        day += f", {date}"
        if day not in grouped:
            grouped[day] = []
        grouped[day].append(meeting)
    return grouped


def group_meetings_by_day_student(meetings):
    """функция для группировки встреч"""
    grouped = {}
    for meeting in meetings:
        meeting_time = datetime.fromisoformat(meeting["start_time"].replace("Z", "+00:00"))
        day = days_translation.get(meeting_time.strftime("%A"))  # Получаем день недели
        date = meeting_time.strftime("%d.%m.%Y")
        day += f", {date}"
        if day not in grouped:
            grouped[day] = []
        grouped[day].append(meeting)
    return grouped


def format_meetings(grouped_meetings):
    """функция для форматирования встреч"""
    alldays = []
    for day, meetings in grouped_meetings.items():
        response = f"*{day}*\n\n"  # Заголовок дня недели
        for meeting in meetings:
            start_time = datetime.fromisoformat(meeting["start_time"].replace("Z", "+00:00"))
            end_time = datetime.fromisoformat(meeting["end_time"].replace("Z", "+00:00"))
            # Форматируем время
            formatted_start_time = start_time.strftime("%H:%M")
            formatted_end_time = end_time.strftime("%H:%M")
            response += f"{formatted_start_time} - {formatted_end_time}\n"
            response += f"Описание: {meeting['description']}\n"
            response += f"Студент: {meeting['student_name']}\n"
            if meeting['project_theme'] != "":
                response += f"Проект: {meeting['project_theme']}\n"
            response += f"{'Онлайн' if meeting['is_online'] else 'Оффлайн'}\n\n"
        response += "\n"
        alldays.append(response)
    return alldays


def format_meetings_student(grouped_meetings):
    """функция для форматирования встреч"""
    alldays = []
    for day, meetings in grouped_meetings.items():
        response = f"*{day}*\n\n"  # Заголовок дня недели
        for meeting in meetings:
            start_time = datetime.fromisoformat(meeting["start_time"].replace("Z", "+00:00"))
            end_time = datetime.fromisoformat(meeting["end_time"].replace("Z", "+00:00"))

            # Форматируем время
            formatted_start_time = start_time.strftime("%H:%M")
            formatted_end_time = end_time.strftime("%H:%M")
            response += f"{formatted_start_time} - {formatted_end_time}\n"
            response += f"Профессор: {meeting['professor_name']}\n"
            response += f"Описание: {meeting['description']}\n"
            response += f"{'Онлайн' if meeting['is_online'] else 'Оффлайн'}\n\n"
        response += "\n"
        alldays.append(response)
    return alldays


def format_single_meeting(meeting):
    """Форматирует одну встречу"""
    start_time = datetime.fromisoformat(meeting["start_time"].replace("Z", "+00:00"))
    end_time = datetime.fromisoformat(meeting["end_time"].replace("Z", "+00:00"))

    # Проверяем, идет ли встреча прямо сейчас
    now = datetime.now(timezone.utc)
    status = ""
    if start_time <= now <= end_time:
        status = "🔴 *Идет прямо сейчас*\n"

    formatted = (
        f"{status}"
        f"*{start_time.strftime('%H:%M')} - {end_time.strftime('%H:%M')}*\n"
        f"Студент: {meeting['student_name']}\n"
        f"Описание: {meeting['description']}\n"
    )

    if meeting.get('project_theme'):
        formatted += f"Проект: {meeting['project_theme']}\n"

    formatted += f"Формат: {'Онлайн' if meeting['is_online'] else 'Оффлайн'}\n"
    return formatted


def send_meeting_with_buttons(bot, chat_id, meeting):
    """Отправляет встречу с кнопками управления"""
    text = format_single_meeting(meeting)

    markup = types.InlineKeyboardMarkup()
    markup.row(
        types.InlineKeyboardButton("❌ Отменить", callback_data=f"cancel_{meeting['id']}"),
        types.InlineKeyboardButton("↩️ Перенести", callback_data=f"reschedule_{meeting['id']}")
    )

    bot.send_message(
        chat_id,
        text,
        parse_mode="Markdown",
        reply_markup=markup
    )