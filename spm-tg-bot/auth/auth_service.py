"""
auth_service - Модуль для обработки аутентификации пользователей.

Этот модуль работает с API
"""
import requests
from bot.bot import HOST_URL, sessionManager, user_sessions


def send_verification_request(credentials):
    """Отправляет запрос на проверку номера и возвращает ответ."""
    response = requests.post(
        HOST_URL + "/api/v1/auth/bot/signinuser",
        json=credentials,
        headers=sessionManager.get_headers(),
        timeout=10,
    )
    return response


def register_student(credentials):
    response = requests.post(
        HOST_URL + "/api/v1/auth/bot/signupstudent",
        json=credentials,
        headers=sessionManager.get_headers(),
        timeout=10,
    )
    return response


def send_student_verification_request(credentials):
    print(sessionManager.get_headers())
    """Отправляет запрос на проверку номера и возвращает ответ."""
    response = requests.post(
        HOST_URL + "/api/v1/auth/bot/signinstudent",
        json=credentials,
        headers=sessionManager.get_headers(),
        timeout=1000,
    )
    return response


def get_account(id):
    print(sessionManager.get_headers())
    """функция для получения аккаунта"""
    response = requests.get(
        f"{HOST_URL}/api/v1/account", headers=user_sessions[id].get_headers(), timeout=10
    )
    print(response)
    print(response.json())
    if response.status_code == 200:
        account = response.json()
        print(response.json)
        return account
    return []


def get_student_account(id):
    print(sessionManager.get_headers())
    """функция для получения аккаунта"""
    response = requests.get(
        f"{HOST_URL}/api/v1/account/student", headers=user_sessions[id].get_headers(), timeout=1000
    )
    print(response)
    print(response.json())
    if response.status_code == 200:
        account = response.json()
        print(response.json)
        return account
    return []
