from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Note
from .serializers import NoteSerializer


class NoteViewSet(viewsets.ModelViewSet):
    """CRUD API for notes (via DRF router)."""
    queryset = Note.objects.all().order_by("-created_at")
    serializer_class = NoteSerializer


class NotesCRUDDirectAPIView(APIView):
    """CRUD with direct model handling (no serializer required)."""

    def get(self, request, id=None):
        if id:
            note = Note.objects.filter(id=id).values().first()
            if not note:
                return Response(
                    {"status": "nok", "message": "Not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )
            return Response({"status": "ok", "data": note}, status=status.HTTP_200_OK)

        notes = list(Note.objects.all().values())
        return Response({"status": "ok", "data": notes}, status=status.HTTP_200_OK)

    def post(self, request):
        data = request.data.copy()

        if not data.get("title") or not data.get("content"):
            return Response(
                {"status": "nok", "message": "title and content required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        note, created = Note.objects.update_or_create(
            title=data["title"],
            defaults={"content": data["content"]},
        )
        text = "created" if created else "updated"
        return Response(
            {"status": "ok", "message": f"Note {text}", "id": note.id},
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    def put(self, request, id=None):
        if not id:
            return Response(
                {"status": "nok", "message": "ID required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = request.data.copy()
        note, created = Note.objects.update_or_create(
            id=id,
            defaults={
                "title": data.get("title", ""),
                "content": data.get("content", ""),
            },
        )
        return Response(
            {"status": "ok", "message": "Note updated"}, status=status.HTTP_200_OK
        )

    def patch(self, request, id=None):
        if not id:
            return Response(
                {"status": "nok", "message": "ID required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = request.data.copy()
        note = Note.objects.filter(id=id).first()
        if not note:
            return Response(
                {"status": "nok", "message": "Not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if "title" in data:
            note.title = data["title"]
        if "content" in data:
            note.content = data["content"]
        note.save()
        return Response(
            {"status": "ok", "message": "Note patched"}, status=status.HTTP_200_OK
        )

    def delete(self, request, id=None):
        if not id:
            return Response(
                {"status": "nok", "message": "ID required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        deleted, _ = Note.objects.filter(id=id).delete()
        if deleted:
            return Response(
                {"status": "ok", "message": "Note deleted"},
                status=status.HTTP_204_NO_CONTENT,
            )
        return Response(
            {"status": "nok", "message": "Not found"}, status=status.HTTP_404_NOT_FOUND
        )
