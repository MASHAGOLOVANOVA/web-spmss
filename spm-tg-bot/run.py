"""docstring for run"""
from auth import auth_handler_init
from meeting import meeting_handler_init
from project import projects_handler_init
from commands import command_handler_init
from task import task_handler_init
from professor import professor_handler_init
from bot.bot import bot

command_handler_init(bot)
auth_handler_init(bot)
projects_handler_init(bot)
meeting_handler_init(bot)
task_handler_init(bot)
professor_handler_init(bot)

print("bot runs")
bot.polling(none_stop=True, interval=0)
print("bot stopped")
