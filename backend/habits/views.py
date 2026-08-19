from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Habit, HabitLog
from .serializers import HabitSerializer, HabitLogSerializer

class HabitViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = HabitSerializer

    def get_queryset(self):
        return Habit.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class HabitLogViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = HabitLogSerializer

    def get_queryset(self):
        return HabitLog.objects.filter(habit__user=self.request.user)