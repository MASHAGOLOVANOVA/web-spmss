"""
project_service - Модуль для работы с проектами

Этот модуль работает с API
"""
import requests
from requests import RequestException

from bot.bot import HOST_URL, user_sessions


def add_project(id, project_theme, student_id, project_year, repo_owner, repository_name):
    """Бизнес-логика для добавления проекта."""
    response = requests.post(
        f"{HOST_URL}/api/v1/projects/add",
        json={
            "theme": project_theme,
            "student_id": student_id,
            "year": project_year,
            "repository_owner_login": repo_owner,
            "repository_name": repository_name,
        },
        headers=user_sessions[id].get_headers(),
        timeout=10,
    )

    if response.status_code == 200:
        return f'Проект "{project_theme}" успешно добавлен!'
    return f"Ошибка при добавлении проекта: {response.status_code}"


def get_projects(id):
    """Получает проекты из API."""
    response = requests.get(
        f"{HOST_URL}/api/v1/projects/",
        headers=user_sessions[id].get_headers(),
        timeout=10,
    )
    if response.status_code == 200:
        return response.json().get("projects", [])
    raise RequestException(f"Ошибка при получении проектов: {response.status_code}")


def get_project_details(id, project_id):
    """Отправляет запрос на получение деталей проекта."""
    headers = user_sessions[id].get_headers()
    response = requests.get(
        f"{HOST_URL}/api/v1/projects/{project_id}", headers=headers, timeout=10
    )
    return response


def get_project_statistics(id, project_id):
    """Выполняет запрос для получения статистики проекта."""
    response = requests.get(
        f"{HOST_URL}/api/v1/projects/{project_id}/statistics",
        headers=user_sessions[id].get_headers(),
        timeout=10,
    )
    return response


def get_project_commits(id, project_id, from_time):
    """Выполняет запрос для получения коммитов проекта."""
    url = f"{HOST_URL}/api/v1/projects/{project_id}/commits?from={from_time}"
    response = requests.get(url, headers=user_sessions[id].get_headers(), timeout=10)
    return response
