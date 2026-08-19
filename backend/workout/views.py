from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Workout, Exercise
from .serializers import WorkoutSerializer, ExerciseSerializer

class WorkoutViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = WorkoutSerializer

    def get_queryset(self):
        return Workout.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class ExerciseViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = ExerciseSerializer

    def get_queryset(self):
        return Exercise.objects.filter(workout__user=self.request.user)