from django.contrib import admin
from django.urls import path, include
from NotesCRUD.views import NotesCRUDDirectAPIView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("authentication.urls")),          # auth gateway
    path("api/notes/", NotesCRUDDirectAPIView.as_view(), name="notes-list"),
    path("api/notes/<int:id>/", NotesCRUDDirectAPIView.as_view(), name="notes-detail"),
    path("api/tasks/", include("Tasks.urls")),
    path("api/customers/", include("CustomerOrders.urls")),
    path("api/chat/", include("ai_gateway.urls")),
]
