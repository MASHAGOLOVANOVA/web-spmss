"""
integration_service - Модуль для работы с интеграциями пользователя

Этот модуль работает с API
"""
import requests
from bot.bot import HOST_URL, user_sessions


def get_integrations(id):
    """функция для получения интеграций"""
    integrations_response = requests.get(
        f"{HOST_URL}/api/v1/account/integrations",
        headers=user_sessions[id].get_headers(),
        timeout=10,
    )
    return integrations_response
