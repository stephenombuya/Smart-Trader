from django.urls import path
from ..views.user_views import (
    UserProfileView, UserWalletView, UserActivityView,
    UserListView, WithdrawalRequestView,
)

urlpatterns = [
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    path('wallet/', UserWalletView.as_view(), name='user-wallet'),
    path('activity/', UserActivityView.as_view(), name='user-activity'),
    path('list/', UserListView.as_view(), name='user-list'),
    path('withdraw/', WithdrawalRequestView.as_view(), name='withdraw'),
]
