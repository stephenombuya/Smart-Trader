from django.urls import path
from ..views.payment_views import MpesaCallbackView, WithdrawalStatusView

urlpatterns = [
    path('mpesa/callback/', MpesaCallbackView.as_view(), name='mpesa-callback'),
    path('withdrawal/<uuid:pk>/status/', WithdrawalStatusView.as_view(), name='withdrawal-status'),
]
