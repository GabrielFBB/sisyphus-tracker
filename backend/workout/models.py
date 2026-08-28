from django.db import models
from django.contrib.auth.models import User

class Workout(models.Model):
    MODALITY_CHOICES = [
        ('strength', 'Musculação'),
        ('martial', 'Artes marciais'),
        ('cardio', 'Cardio'),
        ('other', 'Outro'),
    ]

    METHOD_CHOICES = [
        ('', 'Sem método'),
        ('ppl', 'Push Pull Legs'),
        ('upper_lower', 'Upper Lower'),
        ('full_body', 'Full Body'),
        ('abc', 'ABC'),
        ('other', 'Outro'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    date = models.DateField(null=True, blank=True)
    modality = models.CharField(max_length=20, choices=MODALITY_CHOICES, default='strength')
    method = models.CharField(max_length=20, choices=METHOD_CHOICES, blank=True, default='')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Exercise(models.Model):
    workout = models.ForeignKey(Workout, on_delete=models.CASCADE, related_name='exercises')
    name = models.CharField(max_length=255)
    sets = models.IntegerField(default=1)
    reps = models.IntegerField(default=1)
    weight = models.FloatField(null=True, blank=True)

    def __str__(self):
        return self.name

class WorkoutSession(models.Model):
    workout = models.ForeignKey(Workout, on_delete=models.CASCADE, related_name='sessions')
    date = models.DateField()

    class Meta:
        unique_together = ('workout', 'date')
        ordering = ['-date']

    def __str__(self):
        return f"{self.workout.name} - {self.date}"