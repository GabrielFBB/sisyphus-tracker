from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Book
from .serializers import BookSerializer

class BookViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = BookSerializer

    def get_queryset(self):
        return Book.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)