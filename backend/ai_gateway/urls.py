from django.urls import re_path
from .views import AIGatewayProxyView

urlpatterns = [
    re_path(r'^(?P<path>.*)$', AIGatewayProxyView.as_view(), name='ai_gateway_proxy'),
]
