from django.urls import path
from ..views.social_views import GoogleAuthView
from rest_framework_simplejwt.views import TokenRefreshView
from ..views.auth_views import (
    RegisterView, VerifyEmailView, LoginView, LogoutView,
    ForgotPasswordView, ResetPasswordView, ChangePasswordView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('verify-email/', VerifyEmailView.as_view(), name='verify-email'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot-password'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset-password'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('google/', GoogleAuthView.as_view(), name='google-auth'),
]
