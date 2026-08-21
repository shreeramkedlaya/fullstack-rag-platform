from django.urls import path
from CustomerOrders.customer.views import (
    CustomerListCreateAPIView,
    CustomerDetailAPIView,
    CustomerBulkUpdateAPIView,
    CustomerBulkDeleteAPIView,
)
from CustomerOrders.orders.views import (
    OrderListCreateAPIView,
    OrderDetailAPIView,
    OrderBulkUpdateAPIView,
)

urlpatterns = [
    # Customer endpoints
    path('', CustomerListCreateAPIView.as_view(), name='customer-list'),
    path('bulk-update/', CustomerBulkUpdateAPIView.as_view(), name='customer-bulk-update'),
    path('bulk-delete/', CustomerBulkDeleteAPIView.as_view(), name='customer-bulk-delete'),
    path('<int:id>/', CustomerDetailAPIView.as_view(), name='customer-detail'),

    # Order endpoints
    path('orders/', OrderListCreateAPIView.as_view(), name='order-list'),
    path('orders/bulk-update/', OrderBulkUpdateAPIView.as_view(), name='order-bulk-update'),
    path('orders/<int:id>/', OrderDetailAPIView.as_view(), name='order-detail'),
]
# Auth endpoints removed — they now live at /api/auth/ (see authentication/urls.py)
