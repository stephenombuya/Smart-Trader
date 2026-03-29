"""
Admin Panel API Views — restricted to staff/admin users.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from rest_framework import generics
from django.contrib.auth import get_user_model
from django.db.models import Sum, Count, Avg
from django.utils import timezone
from datetime import timedelta

from apps.earnings.models import Transaction, YouTubeAd, Task, TaskCompletion, SpinWheelReward
from apps.referrals.models import ReferralCommission

User = get_user_model()


class AdminDashboardView(APIView):
    """High-level platform metrics for admin."""
    permission_classes = [IsAdminUser]

    def get(self, request):
        today = timezone.now().date()
        last_30 = timezone.now() - timedelta(days=30)

        total_users = User.objects.count()
        verified_users = User.objects.filter(is_verified=True).count()
        new_users_today = User.objects.filter(date_joined__date=today).count()
        new_users_30d = User.objects.filter(date_joined__gte=last_30).count()

        total_transactions = Transaction.objects.filter(status='completed')
        total_payouts = total_transactions.filter(transaction_type='withdrawal').aggregate(
            total=Sum('amount')
        )['total'] or 0
        total_commissions = total_transactions.filter(transaction_type='referral_commission').aggregate(
            total=Sum('amount')
        )['total'] or 0
        total_ad_rewards = total_transactions.filter(transaction_type='ad_watch').aggregate(
            total=Sum('amount')
        )['total'] or 0

        return Response({
            'users': {
                'total': total_users,
                'verified': verified_users,
                'new_today': new_users_today,
                'new_last_30_days': new_users_30d,
            },
            'financials': {
                'total_payouts': float(total_payouts),
                'total_commissions_paid': float(total_commissions),
                'total_ad_rewards': float(total_ad_rewards),
            },
            'platform': {
                'active_ads': YouTubeAd.objects.filter(is_active=True).count(),
                'active_tasks': Task.objects.filter(is_active=True).count(),
                'pending_task_reviews': TaskCompletion.objects.filter(status='pending').count(),
            }
        })


class AdminUserDetailView(APIView):
    """Admin: View/manage a specific user."""
    permission_classes = [IsAdminUser]

    def get(self, request, user_id):
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)

        from apps.users.serializers import UserProfileSerializer
        transactions = Transaction.objects.filter(user=user).order_by('-created_at')[:20]
        from apps.earnings.serializers import TransactionSerializer

        return Response({
            'user': UserProfileSerializer(user).data,
            'recent_transactions': TransactionSerializer(transactions, many=True).data,
            'team_size': user.get_downline_count(),
        })

    def patch(self, request, user_id):
        """Suspend or unsuspend a user."""
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)

        if 'is_active' in request.data:
            user.is_active = request.data['is_active']
            user.save(update_fields=['is_active'])
        return Response({'status': 'updated', 'is_active': user.is_active})


class AdminTaskReviewView(APIView):
    """Approve or reject task completions."""
    permission_classes = [IsAdminUser]

    def get(self, request):
        pending = TaskCompletion.objects.filter(status='pending').select_related('user', 'task')
        from apps.earnings.serializers import TaskCompletionSerializer
        return Response(TaskCompletionSerializer(pending, many=True).data)

    def post(self, request, completion_id):
        try:
            completion = TaskCompletion.objects.select_related('user', 'task').get(pk=completion_id)
        except TaskCompletion.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

        action = request.data.get('action')  # 'approve' or 'reject'
        if action not in ('approve', 'reject'):
            return Response({'error': 'action must be approve or reject'}, status=400)

        if action == 'approve':
            completion.status = 'approved'
            completion.reviewed_at = timezone.now()
            completion.save(update_fields=['status', 'reviewed_at'])

            task = completion.task
            txn = Transaction.objects.create(
                user=completion.user,
                transaction_type='task_completion',
                amount=task.reward_amount,
                points=task.reward_points,
                status='completed',
                description=f'Task reward: {task.title}',
            )
            completion.transaction = txn
            completion.save(update_fields=['transaction'])

            if task.reward_amount > 0:
                completion.user.credit_wallet(task.reward_amount, 'Task reward')
            if task.reward_points > 0:
                from django.db.models import F
                User.objects.filter(pk=completion.user.pk).update(
                    points_balance=F('points_balance') + task.reward_points
                )
            Task.objects.filter(pk=task.pk).update(
                current_completions=task.current_completions + 1
            )
        else:
            completion.status = 'rejected'
            completion.reviewed_at = timezone.now()
            completion.save(update_fields=['status', 'reviewed_at'])

        return Response({'status': completion.status})


class AdminCommissionSettingsView(APIView):
    """View/update commission rate settings (stored in DB-based config)."""
    permission_classes = [IsAdminUser]

    def get(self, request):
        from django.conf import settings
        return Response({
            'commission_rates': settings.COMMISSION_RATES,
            'min_withdrawal': settings.MIN_WITHDRAWAL_AMOUNT,
            'max_mlm_levels': 5,
        })


class AdminReportView(APIView):
    """Generate earnings/commission report."""
    permission_classes = [IsAdminUser]

    def get(self, request):
        days = int(request.query_params.get('days', 30))
        since = timezone.now() - timedelta(days=days)

        # Daily earnings breakdown
        daily = Transaction.objects.filter(
            created_at__gte=since,
            status='completed',
        ).extra(
            select={'day': "DATE(created_at)"}
        ).values('day', 'transaction_type').annotate(
            total=Sum('amount'),
            count=Count('id'),
        ).order_by('day')

        # Top earners
        top_earners = User.objects.order_by('-total_earned')[:10].values(
            'id', 'email', 'first_name', 'last_name', 'total_earned', 'total_withdrawn'
        )

        return Response({
            'period_days': days,
            'daily_breakdown': list(daily),
            'top_earners': list(top_earners),
        })
