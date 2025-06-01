"""
professor_service - Модуль для работы с профессорами

Этот модуль работает с API
"""
import requests
from bot.bot import user_sessions, HOST_URL


def get_professors(id):
    url = f"{HOST_URL}/api/v1/professors"
    response = requests.get(
        url, headers=user_sessions[id].get_headers(), timeout=1000)
    if response.status_code == 200:
        response_data = response.json()
        professors = response_data.get("professors", [])
        return professors
    return []
