"""
meeting_service - Модуль для работы сс встречами

Этот модуль работает с API
"""
from datetime import datetime
import requests
from requests import RequestException

from bot.bot import HOST_URL, user_sessions


def get_meetings(id, is_professor):
    """функция для получения расписания"""
    current_time = datetime.utcnow()
    start_of_day = current_time.replace(hour=0, minute=0, second=0, microsecond=0)

    iso_format_time = start_of_day.strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"
    # Формируем URL с параметром from
    url = f"{HOST_URL}/api/v1/slots/professor/student"
    if not is_professor:
        url = f"{HOST_URL}/api/v1/slots/student"
    # Выполняем GET-запрос
    response = requests.get(url, headers=user_sessions[id].get_headers(), timeout=10000)
    if response.status_code == 200:
        response_data = response.json()
        meetings = response_data.get("slots", [])
        print(response.json())
        return meetings
    return []


def add_meeting(id, meeting_data):
    """Отправляет запрос на создание встречи."""
    url = f"{HOST_URL}/api/v1/meetings/add"
    response = requests.post(
        url, json=meeting_data, headers=user_sessions[id].get_headers(), timeout=10
    )

    if response.status_code == 200:
        return True
    raise RequestException(
        f"Ошибка при добавлении встречи: {response.status_code}, {response.text}"
    )


def get_professor_slots(id, professor_id):
    url = f"{HOST_URL}/api/v1/slots/professor/{professor_id}?filter=free"
    response = requests.get(url, headers=user_sessions[id].get_headers(), timeout=1000)
    if response.status_code == 200:
        response_data = response.json()
        meetings = response_data.get("slots", [])
        return meetings
    return []


def choose_slot(id, slot_id):
    url = f"{HOST_URL}/api/v1/slots/{slot_id}/choose"
    response = requests.post(url=url, headers=user_sessions[id].get_headers(), timeout=1000)
    return response.status_code


def cancel_meeting(id, slot_id):
    url = f"{HOST_URL}/api/v1/slots/{slot_id}/del"
    response = requests.delete(url=url, headers=user_sessions[id].get_headers(), timeout=1000)
    if response.status_code == 200:
        return True
    return False


def reschedule_meeting(id, slot_id, new_time):
    meeting = {
        "description": "",
        "meeting_time": new_time,
        "duration": 0,
        "is_online": True,
    }
    meetings = get_meetings(id, is_professor=True)
    print(meetings)
    for m in meetings:
        if m["id"] == slot_id:
            meeting["is_online"] = m["is_online"]
            meeting["duration"] = m["duration"]
            meeting["description"] = m["description"]
            break

    url = f"{HOST_URL}/api/v1/slots/{slot_id}/update"
    response = requests.put(url=url, headers=user_sessions[id].get_headers(),
                            json=meeting, timeout=1000)
    if response.status_code == 200:
        return True
    return False