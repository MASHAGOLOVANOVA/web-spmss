import pytest
from unittest.mock import MagicMock, patch, call
import telebot
from commands.command_handler import command_handler_init


@pytest.fixture
def mock_bot():
    """Фикстура для создания мокового бота с правильной настройкой"""
    bot = MagicMock(spec=telebot.TeleBot)

    handlers = []

    def message_handler(*args, **kwargs):
        def decorator(func):
            handlers.append(func)
            return func

        return decorator

    bot.message_handler = message_handler

    mock_button = MagicMock()
    mock_button.text = "Отправить номер телефона"
    mock_button.request_contact = True

    mock_markup = MagicMock()
    mock_markup.keyboard = [[mock_button]]  # Теперь keyboard содержит кнопку
    mock_markup.one_time_keyboard = True
    mock_markup.resize_keyboard = False

    # Патчим создание объектов
    with patch('telebot.types.ReplyKeyboardMarkup', return_value=mock_markup), \
            patch('telebot.types.KeyboardButton', return_value=mock_button):
        yield bot, handlers


def test_command_handler_init_registers_start_handler(mock_bot):
    """Тест проверяет, что хендлер для команды /start регистрируется"""
    bot, handlers = mock_bot
    command_handler_init(bot)
    assert len(handlers) == 1


def test_start_message_handler_sends_correct_response(mock_bot):
    """Тест проверяет, что хендлер start_message отправляет правильное сообщение"""
    bot, handlers = mock_bot
    command_handler_init(bot)

    mock_message = MagicMock()
    mock_message.chat.id = 123
    handlers[0](mock_message)

    bot.send_message.assert_called_once()
    args, kwargs = bot.send_message.call_args

    assert args[0] == 123
    assert "Привет!" in args[1]
    assert "Пожалуйста, отправьте свой номер телефона." in args[1]

    # Проверяем структуру клавиатуры
    keyboard = kwargs['reply_markup']
    assert len(keyboard.keyboard) == 1
    assert len(keyboard.keyboard[0]) == 1
    assert keyboard.keyboard[0][0].text == "Отправить номер телефона"
    assert keyboard.keyboard[0][0].request_contact is True


def test_keyboard_properties(mock_bot):
    """Тест проверяет свойства создаваемой клавиатуры"""
    bot, handlers = mock_bot
    command_handler_init(bot)

    mock_message = MagicMock()
    mock_message.chat.id = 123
    handlers[0](mock_message)

    _, kwargs = bot.send_message.call_args
    keyboard = kwargs['reply_markup']

    assert keyboard.one_time_keyboard is True
    assert keyboard.resize_keyboard is False