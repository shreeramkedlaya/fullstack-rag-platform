from django.urls import path
from .views import TaskCRUDAPIView

urlpatterns = [
    path("", TaskCRUDAPIView.as_view(), name="tasks-list"),
    path("<int:id>/", TaskCRUDAPIView.as_view(), name="tasks-detail"),
]
