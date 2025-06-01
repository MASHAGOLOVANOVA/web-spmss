import unittest
from unittest.mock import patch, MagicMock, call
from auth.auth_handler import (
    auth_handler_init,
    verify_number,
    verify_student_number,
    handle_verification_response,
    handle_student_verification_response
)
from auth.auth_service import (
    send_verification_request,
    send_student_verification_request,
    register_student,
    get_account,
    get_student_account
)
from bot.bot import HOST_URL, sessionManager


class TestAuthHandler(unittest.TestCase):
    def setUp(self):
        self.bot = MagicMock()
        self.message = MagicMock()
        self.message.chat.id = 123
        self.message.text = "Test"
        self.message.contact = MagicMock()
        self.message.contact.phone_number = "+79998887766"

    @patch('auth.auth_handler.show_main_menu')
    @patch('auth.auth_handler.get_cloud_drive')
    @patch('auth.auth_handler.get_account')
    @patch('auth.auth_handler.SessionManager')
    def test_handle_verification_response_success(self, mock_session_manager, mock_get_account,
                                                  mock_get_cloud_drive, mock_show_main_menu):
        """Тест успешной обработки ответа верификации"""
        # Настройка моков
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "session_token": "token123",
            "name": "Test User"
        }

        mock_manager_instance = MagicMock()
        mock_session_manager.return_value = mock_manager_instance

        mock_get_account.return_value = {"name": "Test User"}
        mock_get_cloud_drive.return_value = {"type": "Google Drive"}

        # Вызов тестируемой функции
        handle_verification_response(self.bot, self.message, mock_response)

        # Проверки
        mock_session_manager.assert_called_once()
        mock_manager_instance.set_session_token.assert_called_with("token123")
        mock_manager_instance.set_is_professor.assert_called_with(False)
        self.bot.send_message.assert_called_with(123, 'Здравствуйте, Test User!')
        mock_show_main_menu.assert_called_with(123)

    @patch('auth.auth_handler.show_student_main_menu')
    @patch('auth.auth_handler.get_student_account')
    @patch('auth.auth_handler.SessionManager')
    def test_handle_student_verification_response_success(self, mock_session_manager,
                                                          mock_get_student_account,
                                                          mock_show_menu):
        """Тест успешной обработки ответа верификации студента"""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "session_token": "student_token",
            "name": "Student User"
        }

        mock_manager_instance = MagicMock()
        mock_session_manager.return_value = mock_manager_instance
        mock_get_student_account.return_value = {"name": "Student User"}

        result = handle_student_verification_response(self.bot, self.message, mock_response)

        self.assertTrue(result)
        mock_session_manager.assert_called_once()
        mock_manager_instance.set_session_token.assert_called_with("student_token")
        self.bot.send_message.assert_called_with(123, 'Здравствуйте, Student User!')
        mock_show_menu.assert_called_with(123)

    @patch('auth.auth_handler.requests')
    def test_verify_number_success(self, mock_requests):
        """Тест успешной верификации номера"""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_requests.post.return_value = mock_response

        credentials = {"phone_number": "+79998887766"}
        verify_number(self.bot, self.message, credentials)

        self.bot.send_message.assert_called_with(123, "Проверяем регистрацию...")

    @patch('auth.auth_handler.requests')
    def test_verify_number_network_error(self, mock_requests):
        """Тест ошибки сети при верификации"""
        mock_requests.post.side_effect = RequestException("Network error")

        credentials = {"phone_number": "+79998887766"}
        verify_number(self.bot, self.message, credentials)

        self.bot.send_message.assert_called_with(123, "Ошибка сети: Network error")


class TestAuthService(unittest.TestCase):
    @patch('auth.auth_service.requests.post')
    def test_send_verification_request(self, mock_post):
        """Тест отправки запроса верификации"""
        mock_response = MagicMock()
        mock_post.return_value = mock_response

        credentials = {"phone_number": "+79998887766"}
        result = send_verification_request(credentials)

        self.assertEqual(result, mock_response)
        mock_post.assert_called_once_with(
            f"{HOST_URL}/api/v1/auth/bot/signinuser",
            json=credentials,
            headers=sessionManager.get_headers(),
            timeout=10
        )

    @patch('auth.auth_service.requests.post')
    def test_register_student(self, mock_post):
        """Тест регистрации студента"""
        mock_response = MagicMock()
        mock_post.return_value = mock_response

        credentials = {
            "login": "+79998887766",
            "name": "Ivan",
            "surname": "Ivanov"
        }
        result = register_student(credentials)

        self.assertEqual(result, mock_response)
        mock_post.assert_called_once_with(
            f"{HOST_URL}/api/v1/auth/bot/signupstudent",
            json=credentials,
            headers=sessionManager.get_headers(),
            timeout=10
        )

    @patch('auth.auth_service.requests.get')
    def test_get_account_success(self, mock_get):
        """Тест успешного получения аккаунта"""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"name": "Test User"}
        mock_get.return_value = mock_response

        # Мокируем user_sessions
        mock_session = MagicMock()
        mock_session.get_headers.return_value = {"Session-Id": "test123"}
        user_sessions = {123: mock_session}

        with patch('auth.auth_service.user_sessions', user_sessions):
            result = get_account(123)

        self.assertEqual(result, {"name": "Test User"})
        mock_get.assert_called_once_with(
            f"{HOST_URL}/api/v1/account",
            headers={"Session-Id": "test123"},
            timeout=10
        )

    @patch('auth.auth_service.requests.get')
    def test_get_student_account_failure(self, mock_get):
        """Тест неудачного получения аккаунта студента"""
        mock_response = MagicMock()
        mock_response.status_code = 404
        mock_get.return_value = mock_response

        # Мокируем user_sessions
        mock_session = MagicMock()
        mock_session.get_headers.return_value = {"Session-Id": "test123"}
        user_sessions = {123: mock_session}

        with patch('auth.auth_service.user_sessions', user_sessions):
            result = get_student_account(123)

        self.assertEqual(result, [])
        mock_get.assert_called_once_with(
            f"{HOST_URL}/api/v1/account/student",
            headers={"Session-Id": "test123"},
            timeout=1000
        )


if __name__ == '__main__':
    unittest.main()