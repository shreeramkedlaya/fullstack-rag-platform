from .models import Order
from .serializers import OrderSerializer
from shared.exceptions import ServiceValidationError, ResourceNotFoundException


class OrderService:
    @staticmethod
    def get_order(id):
        return Order.objects.get(id=id)

    @staticmethod
    def list_orders(customer_id=None):
        if customer_id:
            return Order.objects.filter(customer_id=customer_id).order_by("-due_date")
        return Order.objects.all().order_by("-due_date")

    @staticmethod
    def create_order(data):
        serializer = OrderSerializer(data=data)
        if not serializer.is_valid():
            raise ServiceValidationError("Validation failed", errors=serializer.errors)
        return serializer.save()

    @staticmethod
    def update_order(id, data, partial=False):
        order = OrderService.get_order(id)
        serializer = OrderSerializer(order, data=data, partial=partial)
        if not serializer.is_valid():
            raise ServiceValidationError("Validation failed", errors=serializer.errors)
        return serializer.save()

    @staticmethod
    def delete_order(id):
        order = OrderService.get_order(id)
        order.delete()

    @staticmethod
    def bulk_upsert(orders_data):
        if not isinstance(orders_data, list):
            raise ServiceValidationError("Expected a list of items")

        serializers_list = []
        for index, item in enumerate(orders_data):
            order_id = item.get("id")

            if order_id:
                try:
                    order = Order.objects.get(id=order_id)
                except Order.DoesNotExist:
                    raise ResourceNotFoundException(f"Order with id {order_id} not found.")
                serializer = OrderSerializer(order, data=item, partial=True)
            else:
                serializer = OrderSerializer(data=item)

            if not serializer.is_valid():
                identifier = f"id {order_id}" if order_id else f"index {index}"
                raise ServiceValidationError(
                    f"Validation failed for item at {identifier}",
                    errors=serializer.errors,
                )
            serializers_list.append(serializer)

        for serializer in serializers_list:
            serializer.save()
