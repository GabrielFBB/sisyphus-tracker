from rest_framework.routers import DefaultRouter
from .views import WorkoutViewSet, ExerciseViewSet

router = DefaultRouter()
router.register(r'workouts', WorkoutViewSet, basename='workout')
router.register(r'exercises', ExerciseViewSet, basename='exercise')

urlpatterns = router.urls