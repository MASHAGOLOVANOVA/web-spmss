import unittest
from unittest.mock import patch, MagicMock
from integration.integration_service import get_integrations
from integration.integration_handler import (
    get_cloud_drive,
    get_google_planner,
    get_repohub,
)
from bot.bot import HOST_URL


class TestIntegrationService(unittest.TestCase):
    @patch("integration.integration_service.requests.get")
    def test_get_integrations_success(self, mock_get):
        """Тест успешного получения интеграций с правильными заголовками"""
        # Подготовка моков
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "cloud_drive": {
                "type": {"id": 1, "name": "Google Drive"},
                "base_folder_id": "folder123",
                "base_folder_name": "MyFolder",
            },
            "planner": {
                "type": {"id": 2, "name": "Google Calendar"},
                "planner_name": "MyPlanner",
            },
            "repo_hubs": [{"id": 3, "name": "GitHub"}],
        }
        mock_get.return_value = mock_response

        # Мокируем user_sessions с SessionManager
        user_session = MagicMock()
        user_session.session_token = "session123"
        user_session.bot_token = "bot456"
        user_session.get_headers.return_value = {
            "Content-Type": "application/json",
            "Bot-Token": "bot456",
            "tuna-skip-browser-warning": "please",
            "Session-Id": "session123",
        }

        # Временное добавление мока в user_sessions
        from integration.integration_service import user_sessions
        original_user_sessions = user_sessions.copy()
        user_sessions[1] = user_session

        try:
            # Вызов функции
            response = get_integrations(1)

            # Проверки
            self.assertEqual(response.status_code, 200)
            mock_get.assert_called_once_with(
                f"{HOST_URL}/api/v1/account/integrations",
                headers={
                    "Content-Type": "application/json",
                    "Bot-Token": "bot456",
                    "tuna-skip-browser-warning": "please",
                    "Session-Id": "session123",
                },
                timeout=10,
            )
        finally:
            # Восстанавливаем оригинальный user_sessions
            user_sessions.clear()
            user_sessions.update(original_user_sessions)

    @patch("integration.integration_service.requests.get")
    def test_get_integrations_missing_tokens(self, mock_get):
        """Тест с отсутствующими токенами в сессии"""
        user_session = MagicMock()
        user_session.session_token = None
        user_session.bot_token = None
        user_session.get_headers.return_value = {
            "Content-Type": "application/json",
            "Bot-Token": None,
            "tuna-skip-browser-warning": "please",
            "Session-Id": None,
        }

        from integration.integration_service import user_sessions
        original_user_sessions = user_sessions.copy()
        user_sessions[1] = user_session

        try:
            response = get_integrations(1)
            mock_get.assert_called_once_with(
                f"{HOST_URL}/api/v1/account/integrations",
                headers={
                    "Content-Type": "application/json",
                    "Bot-Token": None,
                    "tuna-skip-browser-warning": "please",
                    "Session-Id": None,
                },
                timeout=10,
            )
        finally:
            user_sessions.clear()
            user_sessions.update(original_user_sessions)


class TestIntegrationHandler(unittest.TestCase):
    @patch("integration.integration_handler.get_integrations")
    def test_get_cloud_drive_success(self, mock_get_integrations):
        """Тест успешного получения cloud drive"""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "cloud_drive": {
                "type": {"id": 1, "name": "Google Drive"},
                "base_folder_id": "folder123",
                "base_folder_name": "MyFolder",
            }
        }
        mock_get_integrations.return_value = mock_response

        result = get_cloud_drive()
        self.assertEqual(
            result,
            {
                "type": {"id": 1, "name": "Google Drive"},
                "base_folder_id": "folder123",
                "base_folder_name": "MyFolder",
            },
        )

    # Остальные тесты integration_handler остаются без изменений
    # ...


if __name__ == "__main__":
    unittest.main()