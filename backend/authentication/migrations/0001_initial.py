"""
Migration: Register SystemUser in the authentication app's migration state.

The physical table (customer_orders_db.system_user) was created by
CustomerOrders migration 0006_systemuser and already exists in the DB.

SeparateDatabaseAndState is used here so that:
- Django's migration state knows authentication owns SystemUser
- NO DDL (CREATE TABLE) is executed against the real database
  because the table already exists.

Paired with CustomerOrders/migrations/0007_transfer_systemuser.py which
does the mirror: removes SystemUser from CustomerOrders' state without
dropping the table.
"""
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        # Must run AFTER CustomerOrders removes SystemUser from its state
        ('CustomerOrders', '0007_transfer_systemuser'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            # database_operations = [] means: do NOT touch the actual DB table
            database_operations=[],
            # state_operations = register the model in Django's migration state
            state_operations=[
                migrations.CreateModel(
                    name='SystemUser',
                    fields=[
                        ('id', models.BigAutoField(auto_created=True, primary_key=True,
                                                   serialize=False, verbose_name='ID')),
                        ('email', models.EmailField(max_length=254, unique=True)),
                        ('password', models.CharField(max_length=128)),
                        ('role', models.CharField(
                            choices=[('admin', 'Admin'), ('user', 'User')],
                            default='user', max_length=20)),
                        ('is_active', models.BooleanField(default=True)),
                        ('created_at', models.DateTimeField(auto_now_add=True)),
                    ],
                    options={'db_table': 'system_user'},
                ),
            ],
        ),
    ]
