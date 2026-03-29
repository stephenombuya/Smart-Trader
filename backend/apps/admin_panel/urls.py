from django.urls import path
from .views import (
    AdminDashboardView, AdminUserDetailView, AdminTaskReviewView,
    AdminCommissionSettingsView, AdminReportView,
)

urlpatterns = [
    path('dashboard/', AdminDashboardView.as_view(), name='admin-dashboard'),
    path('users/<uuid:user_id>/', AdminUserDetailView.as_view(), name='admin-user-detail'),
    path('tasks/pending/', AdminTaskReviewView.as_view(), name='admin-task-review'),
    path('tasks/<uuid:completion_id>/review/', AdminTaskReviewView.as_view(), name='admin-task-action'),
    path('commission-settings/', AdminCommissionSettingsView.as_view(), name='admin-commission-settings'),
    path('reports/', AdminReportView.as_view(), name='admin-reports'),
]
