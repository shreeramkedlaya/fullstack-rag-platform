"""
Migration: Transfer SystemUser out of CustomerOrders' migration state.

SeparateDatabaseAndState is used so that:
- Django's migration state no longer sees SystemUser as owned by CustomerOrders
- The actual DB table (customer_orders_db.system_user) is NOT dropped.

Paired with authentication/migrations/0001_initial.py which registers
SystemUser under the authentication app without recreating the table.
"""
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('CustomerOrders', '0006_systemuser'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            # database_operations = [] means: do NOT touch the actual DB table
            database_operations=[],
            # state_operations = unregister SystemUser from CustomerOrders' state
            state_operations=[
                migrations.DeleteModel(name='SystemUser'),
            ],
        ),
    ]
