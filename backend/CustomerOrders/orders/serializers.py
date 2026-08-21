from rest_framework import serializers
from .models import Order

class OrderSerializer(serializers.ModelSerializer):
    """
    Serializer for the Order model.
    Includes an extra read-only field 'balance' to calculate what is left to pay.
    """
    balance = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = ['id', 'customer', 'item_name', 'description', 'due_date', 'amount', 'advanced_paid', 'balance']

    def get_balance(self, obj):
        if obj.amount is not None and obj.advanced_paid is not None:
            return float(obj.amount - obj.advanced_paid)
        return 0.0
