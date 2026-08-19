from rest_framework.routers import DefaultRouter
from .views import HabitViewSet, HabitLogViewSet

router = DefaultRouter()
router.register(r'habits', HabitViewSet, basename='habit')
router.register(r'habitlogs', HabitLogViewSet, basename='habitlog')

urlpatterns = router.urls