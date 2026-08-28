from rest_framework import serializers
from .models import Workout, Exercise, WorkoutSession

class ExerciseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exercise
        fields = '__all__'

class WorkoutSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkoutSession
        fields = '__all__'

class WorkoutSerializer(serializers.ModelSerializer):
    exercises = ExerciseSerializer(many=True, read_only=True)
    sessions = WorkoutSessionSerializer(many=True, read_only=True)

    class Meta:
        model = Workout
        fields = '__all__'
        read_only_fields = ['user', 'created_at']