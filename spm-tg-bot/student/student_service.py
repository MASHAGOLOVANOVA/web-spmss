"""
student_service - Модуль для работы со студентами

Этот модуль работает с API
"""
import json
import requests
import pika
from bot.bot import STUDENT_URL, user_sessions


def get_students(id):
    """функция для получения студентов"""
    response = requests.get(
        f"{STUDENT_URL}/api/v1/students", headers=user_sessions[id].get_headers(), timeout=10
    )
    if response.status_code == 200:
        response_data = response.json()
        students = response_data.get("students", [])
        return students  # Возвращает список студентов в формате JSON
    return []


def add_student(student_data):
    """Добавляет нового студента через RabbitMQ."""
    try:
        connection = pika.BlockingConnection(
            pika.ConnectionParameters(
                'localhost',
                5672,
                '/',
                pika.PlainCredentials('user', 'password')
            )
        )
        channel = connection.channel()

        channel.queue_declare(queue='student_queue')

        # Отправляем сообщение в очередь
        channel.basic_publish(
            exchange='',
            routing_key='student_queue',
            body=json.dumps(student_data)
        )
        print(" [x] Sent student data to RabbitMQ")
        return True  # Успешно отправлено

    except pika.exceptions.AMQPConnectionError as e:
        print(f"Ошибка подключения к RabbitMQ: {e}")
        return False  # Ошибка при отправке
    finally:
        if 'connection' in locals() and connection.is_open:
            connection.close()
