from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from shared.mixins import CustomErrorHandlingMixin
from .models import Customer
from .serializers import CustomerSerializer, CustomerDetailSerializer
from .services import CustomerService


class CustomerListCreateAPIView(CustomErrorHandlingMixin, APIView):
    """
    GET:  List all customers.
    POST: Create a new customer.
    """
    def get(self, request):
        customers = CustomerService.list_customers()
        serializer = CustomerSerializer(customers, many=True)
        return Response(serializer.data)

    def post(self, request):
        CustomerService.create_customer(request.data)
        return Response(
            {"message": "Customer created successfully."},
            status=status.HTTP_201_CREATED,
        )


class CustomerDetailAPIView(CustomErrorHandlingMixin, APIView):
    """
    GET:         Retrieve a customer by id (includes their orders).
    PUT / PATCH: Update a customer by id.
    DELETE:      Delete a customer by id (admin only — enforced by IsAdminForDelete).
    """
    def get(self, request, id):
        customer = CustomerService.get_customer(id)
        serializer = CustomerDetailSerializer(customer)
        return Response(serializer.data)

    def put(self, request, id):
        CustomerService.update_customer(id, request.data)
        return Response({"message": "Customer updated successfully."}, status=status.HTTP_200_OK)

    def patch(self, request, id):
        CustomerService.update_customer(id, request.data, partial=True)
        return Response({"message": "Customer updated successfully."}, status=status.HTTP_200_OK)

    def delete(self, request, id):
        CustomerService.delete_customer(id)
        return Response({"message": "Customer deleted successfully."}, status=status.HTTP_200_OK)


class CustomerBulkUpdateAPIView(CustomErrorHandlingMixin, APIView):
    """
    POST: Bulk update or create customers (upsert).
    If an 'id' is provided, it updates the existing customer.
    If no 'id' is provided, it creates a new customer.
    """
    def post(self, request):
        CustomerService.bulk_upsert(request.data)
        return Response({"message": "Bulk operation successful."}, status=status.HTTP_200_OK)

class CustomerBulkDeleteAPIView(CustomErrorHandlingMixin, APIView):
    """
    POST: Bulk delete customers.
    Expects a JSON payload like: {"ids": [1, 2, 3]}
    """
    def post(self, request):
        ids = request.data.get("ids")
        if not ids:
            return Response({"message": "No IDs provided."}, status=status.HTTP_400_BAD_REQUEST)
        
        CustomerService.bulk_delete(ids)
        return Response({"message": "Bulk delete successful."}, status=status.HTTP_200_OK)
