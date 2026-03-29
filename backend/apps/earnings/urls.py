from django.urls import path
from .views import (
    AdListView, StartAdWatchView, CompleteAdWatchView,
    SpinWheelView, ExecuteSpinView, SpinHistoryView,
    TaskListView, SubmitTaskView, DashboardStatsView,
)

urlpatterns = [
    # Dashboard
    path('dashboard/', DashboardStatsView.as_view(), name='dashboard-stats'),

    # YouTube Ads
    path('ads/', AdListView.as_view(), name='ad-list'),
    path('ads/<uuid:ad_id>/start/', StartAdWatchView.as_view(), name='start-ad-watch'),
    path('ads/watch/<uuid:watch_id>/complete/', CompleteAdWatchView.as_view(), name='complete-ad-watch'),

    # Spin Wheel
    path('spin/', SpinWheelView.as_view(), name='spin-wheel'),
    path('spin/execute/', ExecuteSpinView.as_view(), name='execute-spin'),
    path('spin/history/', SpinHistoryView.as_view(), name='spin-history'),

    # Tasks
    path('tasks/', TaskListView.as_view(), name='task-list'),
    path('tasks/<uuid:task_id>/submit/', SubmitTaskView.as_view(), name='submit-task'),
]
