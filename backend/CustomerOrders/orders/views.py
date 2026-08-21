from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from shared.mixins import CustomErrorHandlingMixin
from .serializers import OrderSerializer
from .services import OrderService


class OrderListCreateAPIView(CustomErrorHandlingMixin, APIView):
    """
    GET:  List all orders, optionally filtered by ?customer_id=<id>
    POST: Create a new order.
    """
    def get(self, request):
        customer_id = request.query_params.get('customer_id')
        orders = OrderService.list_orders(customer_id=customer_id)
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)

    def post(self, request):
        OrderService.create_order(request.data)
        return Response(
            {"message": "Order created successfully."},
            status=status.HTTP_201_CREATED,
        )


class OrderDetailAPIView(CustomErrorHandlingMixin, APIView):
    """
    GET:         Retrieve an order by id.
    PUT / PATCH: Update an order by id.
    DELETE:      Delete an order by id (admin only — enforced by IsAdminForDelete).
    """
    def get(self, request, id):
        order = OrderService.get_order(id)
        serializer = OrderSerializer(order)
        return Response(serializer.data)

    def put(self, request, id):
        OrderService.update_order(id, request.data)
        return Response({"message": "Order updated successfully."}, status=status.HTTP_200_OK)

    def patch(self, request, id):
        OrderService.update_order(id, request.data, partial=True)
        return Response({"message": "Order updated successfully."}, status=status.HTTP_200_OK)

    def delete(self, request, id):
        OrderService.delete_order(id)
        return Response({"message": "Order deleted successfully."}, status=status.HTTP_200_OK)


class OrderBulkUpdateAPIView(CustomErrorHandlingMixin, APIView):
    """
    POST: Bulk update or create orders (upsert).
    If an 'id' is provided, it updates the existing order.
    If no 'id' is provided, it creates a new order.
    """
    def post(self, request):
        OrderService.bulk_upsert(request.data)
        return Response({"message": "Bulk operation successful."}, status=status.HTTP_200_OK)
