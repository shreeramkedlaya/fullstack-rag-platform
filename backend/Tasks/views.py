from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Task
from .serializers import TaskSerializer


class TaskCRUDAPIView(APIView):
    def get(self, request, id=None):
        if id:
            task = get_object_or_404(Task, id=id)
            serializer = TaskSerializer(task)
            return Response(serializer.data)
        tasks = Task.objects.all().order_by("-created_at")
        serializer = TaskSerializer(tasks, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = TaskSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, id=None):
        if not id:
            return Response(
                {"detail": "ID required"}, status=status.HTTP_400_BAD_REQUEST
            )
        task = get_object_or_404(Task, id=id)
        serializer = TaskSerializer(task, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, id=None):
        if not id:
            return Response(
                {"detail": "ID required"}, status=status.HTTP_400_BAD_REQUEST
            )
        task = get_object_or_404(Task, id=id)
        serializer = TaskSerializer(task, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, id=None):
        if not id:
            return Response(
                {"detail": "ID required"}, status=status.HTTP_400_BAD_REQUEST
            )
        task = get_object_or_404(Task, id=id)
        task.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
