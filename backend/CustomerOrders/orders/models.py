from django.db import models
from CustomerOrders.customer.models import Customer

class Order(models.Model):
    """
    Represents an Order placed by a Customer.
    Includes financial details and due dates.
    """
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name="orders")
    
    item_name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    due_date = models.DateField()
    
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    advanced_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    db_using = "customer_orders_db"

    class Meta:
        db_table = "customer_order"

    def __str__(self):
        return f"Order {self.id} for {self.customer.customer_name}"
