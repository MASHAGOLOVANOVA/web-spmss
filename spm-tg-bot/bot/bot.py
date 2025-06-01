# -*- coding: utf-8 -*-
"""Этот модуль реализует функциональность бота Telegram."""
import os
import telebot
from dotenv import load_dotenv

from session_manager import SessionManager

load_dotenv()

HOST_URL = os.getenv("HOST_URL", "https://ddh0xw-193-105-131-7.ru.tuna.am")
CLIENT_URL = os.getenv("CLIENT_URL", "http://localhost:3000")
BOT_TOKEN = os.getenv("BOT_TOKEN", "7772483926:AAFkT_nibrVHwZmlJajxbXRU4Wxe_b7t_RI")
bot = telebot.TeleBot(BOT_TOKEN)
sessionManager = SessionManager()
sessionManager.set_bot_token(BOT_TOKEN)
UNI_HOST_URL = "https://bxksa4-78-85-214-5.ru.tuna.am"
STUDENT_URL = "https://e4vx1n-78-85-214-5.ru.tuna.am"
user_sessions = {}