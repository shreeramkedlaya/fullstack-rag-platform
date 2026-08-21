from rest_framework import serializers
from .models import Customer

class CustomerSerializer(serializers.ModelSerializer):
    """
    Serializer for the Customer model.
    """
    class Meta:
        model = Customer
        fields = ['id', 'customer_name', 'phone', 'address', 'dateSince']

class CustomerDetailSerializer(CustomerSerializer):
    """
    Detailed serializer that includes the list of orders for the customer.
    Useful for retrieving a customer and their orders in a single request,
    though we will also provide separate order endpoints.
    """
    # Lazy import to avoid circular dependency issues at module load time
    @property
    def fields(self):
        fields = super().fields
        from CustomerOrders.orders.serializers import OrderSerializer
        fields['orders'] = OrderSerializer(many=True, read_only=True)
        return fields

    class Meta(CustomerSerializer.Meta):
        fields = CustomerSerializer.Meta.fields + ['orders']
