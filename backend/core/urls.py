from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('habits.urls')),
    path('api/', include('workout.urls')),
    path('api/', include('reading.urls')),
]