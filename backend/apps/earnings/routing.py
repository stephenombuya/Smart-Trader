from django.urls import re_path
from .consumers import SpinWheelConsumer

websocket_urlpatterns = [
    re_path(r'ws/spin/$', SpinWheelConsumer.as_asgi()),
]
