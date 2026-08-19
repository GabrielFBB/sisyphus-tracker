from django.contrib import admin
from .models import Habit, HabitLog

admin.site.register(Habit)
admin.site.register(HabitLog)