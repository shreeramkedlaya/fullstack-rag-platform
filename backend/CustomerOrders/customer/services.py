from .models import Customer
from .serializers import CustomerSerializer
from shared.exceptions import ServiceValidationError, ResourceNotFoundException

# Re-export so orders/services.py can keep a single import path if needed
__all__ = ['CustomerService', 'ServiceValidationError', 'ResourceNotFoundException']


class CustomerService:
    @staticmethod
    def get_customer(id):
        return Customer.objects.get(id=id)

    @staticmethod
    def list_customers():
        return Customer.objects.all().order_by("-id")

    @staticmethod
    def create_customer(data):
        serializer = CustomerSerializer(data=data)
        if not serializer.is_valid():
            raise ServiceValidationError("Validation failed", errors=serializer.errors)
        return serializer.save()

    @staticmethod
    def update_customer(id, data, partial=False):
        customer = CustomerService.get_customer(id)
        serializer = CustomerSerializer(customer, data=data, partial=partial)
        if not serializer.is_valid():
            raise ServiceValidationError("Validation failed", errors=serializer.errors)
        return serializer.save()

    @staticmethod
    def delete_customer(id):
        customer = CustomerService.get_customer(id)
        customer.delete()

    @staticmethod
    def bulk_upsert(customers_data):
        if not isinstance(customers_data, list):
            raise ServiceValidationError("Expected a list of items")

        serializers_list = []
        
        # Pre-fetch existing customers to prevent N+1 query bottleneck
        customer_ids = [item.get("id") for item in customers_data if item.get("id")]
        existing_customers = {
            c.id: c for c in Customer.objects.filter(id__in=customer_ids)
        }

        for index, item in enumerate(customers_data):
            customer_id = item.get("id")

            if customer_id:
                customer = existing_customers.get(customer_id)
                if not customer:
                    raise ResourceNotFoundException(
                        f"Customer with id {customer_id} not found."
                    )
                serializer = CustomerSerializer(customer, data=item, partial=True)
            else:
                serializer = CustomerSerializer(data=item)

            if not serializer.is_valid():
                identifier = f"id {customer_id}" if customer_id else f"index {index}"
                raise ServiceValidationError(
                    f"Validation failed for item at {identifier}",
                    errors=serializer.errors,
                )
            serializers_list.append(serializer)

        for serializer in serializers_list:
            serializer.save()

    @staticmethod
    def bulk_delete(ids):
        if not isinstance(ids, list):
            raise ServiceValidationError("Expected a list of IDs")
        # Django bulk delete is extremely efficient and handles this in a single query
        Customer.objects.filter(id__in=ids).delete()
