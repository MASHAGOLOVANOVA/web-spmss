""" session_manager - Класс для headers запросов по API """


class SessionManager:
    """Класс для получении инфы о сессии"""

    def __init__(self):
        """Класс для получении инфы о сессии"""
        self.session_token = None
        self.bot_token = None
        self.is_professor = None
        self.rescheduling = None

    def set_is_professor(self, is_professor):
        self.is_professor = is_professor

    def set_session_token(self, token):
        """функция для апдейта токена сессии"""
        print(token)
        self.session_token = token

    def set_bot_token(self, token):
        """функция для апдейта бот токена"""
        self.bot_token = token

    def is_professor(self):
        return self.is_professor

    def reschedule_process(self):
        return self.rescheduling

    def set_rescheduling(self, rescheduling):
        self.rescheduling = rescheduling

    def get_headers(self):
        """функция для получения хедеров запросов"""
        return {
            "Content-Type": "application/json",
            "Bot-Token": self.bot_token,
            "tuna-skip-browser-warning": "please",
            "Session-Id": self.session_token,
        }
