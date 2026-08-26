from django.db import models
from django.contrib.auth.models import User

class Habit(models.Model):
    TYPE_CHOICES = [
        ('binary', 'Sim/Não'),
        ('quantity', 'Quantidade'),
        ('duration', 'Duração'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    habit_type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='binary')
    target = models.FloatField(default=1)
    unit = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class HabitLog(models.Model):
    habit = models.ForeignKey(Habit, on_delete=models.CASCADE, related_name='logs')
    date = models.DateField()
    value = models.FloatField(default=0)
    completed = models.BooleanField(default=False)

    class Meta:
        unique_together = ('habit', 'date')

    def save(self, *args, **kwargs):
        target = self.habit.target if self.habit.target and self.habit.target > 0 else 1
        self.completed = (self.value or 0) >= target
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.habit.name} - {self.date}"