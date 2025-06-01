"""
ed_prog_service - Модуль для работы с учебными направлениями

Этот модуль работает с API
"""
import requests
from bot.bot import UNI_HOST_URL, user_sessions


def get_educational_programmes(id):
    """функция для получения учебных программ"""
    response = requests.get(
        f"{UNI_HOST_URL}/api/v1/universities/1/edprogrammes/",
        headers=user_sessions[id].get_headers(),
        timeout=10,
    )
    if response.status_code == 200:
        response_data = response.json()
        educational_programmes = response_data.get("programmes", [])
        return educational_programmes  # Возвращает список образовательных программ в формате JSON
    return []
