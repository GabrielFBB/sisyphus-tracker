from rest_framework.routers import DefaultRouter
from .views import WorkoutViewSet, ExerciseViewSet, WorkoutSessionViewSet

router = DefaultRouter()
router.register(r'workouts', WorkoutViewSet, basename='workout')
router.register(r'exercises', ExerciseViewSet, basename='exercise')
router.register(r'sessions', WorkoutSessionViewSet, basename='session')

urlpatterns = router.urls