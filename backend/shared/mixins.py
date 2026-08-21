from rest_framework.response import Response
from rest_framework import status
from django.http import Http404
from django.core.exceptions import ObjectDoesNotExist
from shared.exceptions import ServiceValidationError, ResourceNotFoundException


class CustomErrorHandlingMixin:
    """
    Mixin to provide structured JSON error responses for 404, 400, and 500 errors.
    Used by all API views that call into service layers.
    Moved here from CustomerOrders/customer/views.py so all domain apps share it.
    """
    def handle_exception(self, exc):
        if isinstance(exc, (Http404, ObjectDoesNotExist)):
            return Response({"message": "Resource not found."}, status=status.HTTP_404_NOT_FOUND)

        if isinstance(exc, ResourceNotFoundException):
            return Response({"message": exc.message}, status=status.HTTP_404_NOT_FOUND)

        if isinstance(exc, ServiceValidationError):
            payload = {"message": exc.message}
            if exc.errors:
                payload["errors"] = exc.errors
            return Response(payload, status=status.HTTP_400_BAD_REQUEST)

        response = super().handle_exception(exc)

        if response is None:
            return Response(
                {"message": "An internal server error occurred.", "details": str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        return response
