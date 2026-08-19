from rest_framework import serializers
from .models import Habit, HabitLog

class HabitLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = HabitLog
        fields = '__all__'

class HabitSerializer(serializers.ModelSerializer):
    logs = HabitLogSerializer(many=True, read_only=True)
    
    class Meta:
        model = Habit
        fields = '__all__'
        read_only_fields = ['user', 'created_at']