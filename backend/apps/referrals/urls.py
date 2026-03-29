from django.urls import path
from .views import ReferralTreeView, CommissionHistoryView, TeamPerformanceView

urlpatterns = [
    path('tree/', ReferralTreeView.as_view(), name='referral-tree'),
    path('commissions/', CommissionHistoryView.as_view(), name='commission-history'),
    path('team-performance/', TeamPerformanceView.as_view(), name='team-performance'),
]
