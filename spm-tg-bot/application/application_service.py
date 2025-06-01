
import requests
from bot.bot import HOST_URL, user_sessions


def submit_supervision_request(id, professor_id):
    """Добавляет новую заявку."""
    url = f"{HOST_URL}/api/v1/professors/{professor_id}/apply"
    response = requests.post(url, headers=user_sessions[id].get_headers(), timeout=1000)
    return response


def get_applications(id):
    url = f"{HOST_URL}/api/v1/applications/student"
    response = requests.get(
        url, headers=user_sessions[id].get_headers(), timeout=1000)
    if response.status_code == 200:
        response_data = response.json()
        applications = response_data.get("applications")
        return applications
    return []