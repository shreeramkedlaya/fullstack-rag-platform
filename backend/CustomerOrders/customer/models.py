from django.db import models


class Customer(models.Model):
    """
    Represents a Customer in the system.
    SystemUser (auth) has been moved to the authentication app.
    """
    customer_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    address = models.TextField()
    dateSince = models.DateField(null=True, blank=True)

    db_using = "customer_orders_db"

    class Meta:
        db_table = "customer"

    def __str__(self):
        return self.customer_name
