"""
Earnings views: Ad watching, Spin Wheel, Tasks
"""
import random
import logging
from decimal import Decimal
from django.utils import timezone
from django.db import transaction as db_transaction
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import (
    YouTubeAd, AdWatch, SpinWheelReward, SpinHistory,
    Task, TaskCompletion, Transaction,
)
from .serializers import (
    YouTubeAdSerializer, SpinWheelRewardSerializer, SpinHistorySerializer,
    TaskSerializer, TaskCompletionSerializer, TransactionSerializer,
)

logger = logging.getLogger(__name__)


class AdListView(generics.ListAPIView):
    """List available YouTube ads for user to watch."""
    permission_classes = [IsAuthenticated]
    serializer_class = YouTubeAdSerializer

    def get_queryset(self):
        user = self.request.user
        today = timezone.now().date()

        # Get ads the user hasn't hit the daily limit for
        watched_today_counts = AdWatch.objects.filter(
            user=user,
            created_at__date=today,
            rewarded=True,
        ).values('ad_id').annotate(count=db_transaction.models.Count('id') if False else __import__('django.db.models', fromlist=['Count']).Count('id'))

        maxed_out_ids = [
            item['ad_id'] for item in watched_today_counts
            if item['count'] >= YouTubeAd.objects.get(pk=item['ad_id']).daily_limit_per_user
        ]

        return YouTubeAd.objects.filter(is_active=True).exclude(id__in=maxed_out_ids)


class StartAdWatchView(APIView):
    """Start watching an ad - creates AdWatch record."""
    permission_classes = [IsAuthenticated]

    def post(self, request, ad_id):
        try:
            ad = YouTubeAd.objects.get(pk=ad_id, is_active=True)
        except YouTubeAd.DoesNotExist:
            return Response({'error': 'Ad not found'}, status=status.HTTP_404_NOT_FOUND)

        # Check daily limit
        today = timezone.now().date()
        watches_today = AdWatch.objects.filter(
            user=request.user, ad=ad, created_at__date=today, rewarded=True
        ).count()

        if watches_today >= ad.daily_limit_per_user:
            return Response(
                {'error': f'Daily limit of {ad.daily_limit_per_user} views reached for this ad'},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        watch = AdWatch.objects.create(
            user=request.user,
            ad=ad,
            ip_address=request.META.get('REMOTE_ADDR'),
        )
        return Response({'watch_id': str(watch.id), 'duration_required': ad.duration_seconds})


class CompleteAdWatchView(APIView):
    """
    Mark ad as watched and credit reward.

    NOTE: In production, this should verify watch completion via
    the YouTube Reporting API (see youtube_service.py).
    Currently uses duration-based validation.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, watch_id):
        try:
            watch = AdWatch.objects.select_related('ad').get(
                pk=watch_id, user=request.user, rewarded=False
            )
        except AdWatch.DoesNotExist:
            return Response({'error': 'Watch record not found or already rewarded'}, status=status.HTTP_404_NOT_FOUND)

        watch_duration = request.data.get('duration_watched', 0)

        # Verify minimum watch duration
        if int(watch_duration) < watch.ad.duration_seconds:
            return Response(
                {'error': f'Must watch for at least {watch.ad.duration_seconds} seconds'},
                status=status.HTTP_400_BAD_REQUEST
            )

        with db_transaction.atomic():
            watch.watch_duration = watch_duration
            watch.is_complete = True
            watch.rewarded = True

            # Create transaction
            txn = Transaction.objects.create(
                user=request.user,
                transaction_type='ad_watch',
                amount=watch.ad.reward_amount,
                points=watch.ad.reward_points,
                status='completed',
                description=f'Reward for watching: {watch.ad.title}',
                metadata={'ad_id': str(watch.ad.id)},
            )
            watch.transaction = txn
            watch.save()

            # Credit wallet and points
            if watch.ad.reward_amount > 0:
                request.user.credit_wallet(watch.ad.reward_amount, 'Ad watch reward')
            if watch.ad.reward_points > 0:
                from django.db.models import F
                type(request.user).objects.filter(pk=request.user.pk).update(
                    points_balance=F('points_balance') + watch.ad.reward_points
                )

            # Increment ad view count
            YouTubeAd.objects.filter(pk=watch.ad.pk).update(
                total_views=watch.ad.total_views + 1
            )

            # Trigger referral commissions for this earning event
            from apps.referrals.tasks import process_referral_commissions
            process_referral_commissions.delay(str(request.user.id), float(watch.ad.reward_amount), 'ad_watch')

        return Response({
            'message': 'Ad watched successfully!',
            'reward': {
                'amount': float(watch.ad.reward_amount),
                'points': watch.ad.reward_points,
            },
            'transaction_id': str(txn.id),
        })


class SpinWheelView(APIView):
    """Get spin wheel config and available rewards."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        rewards = SpinWheelReward.objects.filter(is_active=True)
        # Check if user can spin (1 free spin per day, extra spins cost points)
        today = timezone.now().date()
        spins_today = SpinHistory.objects.filter(
            user=request.user, created_at__date=today
        ).count()

        return Response({
            'rewards': SpinWheelRewardSerializer(rewards, many=True).data,
            'free_spins_remaining': max(0, 1 - spins_today),
            'spins_today': spins_today,
            'extra_spin_cost_points': 50,
        })


class ExecuteSpinView(APIView):
    """Execute a spin wheel action."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        today = timezone.now().date()
        spins_today = SpinHistory.objects.filter(
            user=request.user, created_at__date=today
        ).count()

        use_points = request.data.get('use_points', False)
        extra_spin_cost = 50

        if spins_today >= 1:
            if not use_points:
                return Response(
                    {'error': 'No free spins remaining. Use 50 points for an extra spin.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if request.user.points_balance < extra_spin_cost:
                return Response(
                    {'error': f'Need {extra_spin_cost} points for extra spin'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Select random reward based on probability weights
        rewards = list(SpinWheelReward.objects.filter(is_active=True))
        if not rewards:
            return Response({'error': 'Spin wheel not configured'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        weights = [float(r.probability) for r in rewards]
        chosen_reward = random.choices(rewards, weights=weights, k=1)[0]

        with db_transaction.atomic():
            # Deduct points cost if extra spin
            if spins_today >= 1 and use_points:
                from django.db.models import F
                type(request.user).objects.filter(pk=request.user.pk).update(
                    points_balance=F('points_balance') - extra_spin_cost
                )

            # Create spin history
            txn = None
            if chosen_reward.reward_type != 'nothing':
                txn = Transaction.objects.create(
                    user=request.user,
                    transaction_type='spin_wheel',
                    amount=chosen_reward.reward_value if chosen_reward.reward_type == 'cash' else 0,
                    points=int(chosen_reward.reward_value) if chosen_reward.reward_type == 'points' else 0,
                    status='completed',
                    description=f'Spin wheel reward: {chosen_reward.label}',
                    metadata={'reward_id': str(chosen_reward.id)},
                )

                # Credit reward
                if chosen_reward.reward_type == 'cash':
                    request.user.credit_wallet(chosen_reward.reward_value, 'Spin wheel cash reward')
                elif chosen_reward.reward_type == 'points':
                    from django.db.models import F
                    type(request.user).objects.filter(pk=request.user.pk).update(
                        points_balance=F('points_balance') + int(chosen_reward.reward_value)
                    )

                # Trigger commissions
                if chosen_reward.reward_type == 'cash':
                    from apps.referrals.tasks import process_referral_commissions
                    process_referral_commissions.delay(
                        str(request.user.id), float(chosen_reward.reward_value), 'spin_wheel'
                    )

            SpinHistory.objects.create(
                user=request.user,
                reward=chosen_reward,
                transaction=txn,
            )

        return Response({
            'reward': SpinWheelRewardSerializer(chosen_reward).data,
            'message': f'You won: {chosen_reward.label}!' if chosen_reward.reward_type != 'nothing' else 'Better luck next time!',
        })


class SpinHistoryView(generics.ListAPIView):
    """Get user's spin history."""
    permission_classes = [IsAuthenticated]
    serializer_class = SpinHistorySerializer

    def get_queryset(self):
        return SpinHistory.objects.filter(user=self.request.user).order_by('-created_at')


class TaskListView(generics.ListAPIView):
    """List available tasks."""
    permission_classes = [IsAuthenticated]
    serializer_class = TaskSerializer

    def get_queryset(self):
        now = timezone.now()
        return Task.objects.filter(
            is_active=True
        ).filter(
            models.Q(expires_at__isnull=True) | models.Q(expires_at__gt=now)
        ).filter(
            models.Q(max_completions__isnull=True) | models.Q(current_completions__lt=models.F('max_completions'))
        )

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx


class SubmitTaskView(APIView):
    """Submit a task completion for review."""
    permission_classes = [IsAuthenticated]

    def post(self, request, task_id):
        try:
            task = Task.objects.get(pk=task_id, is_active=True)
        except Task.DoesNotExist:
            return Response({'error': 'Task not found'}, status=status.HTTP_404_NOT_FOUND)

        if TaskCompletion.objects.filter(user=request.user, task=task).exists():
            return Response({'error': 'Task already submitted'}, status=status.HTTP_409_CONFLICT)

        completion = TaskCompletion.objects.create(
            user=request.user,
            task=task,
            proof_url=request.data.get('proof_url', ''),
            notes=request.data.get('notes', ''),
        )
        return Response(
            TaskCompletionSerializer(completion).data,
            status=status.HTTP_201_CREATED
        )


class DashboardStatsView(APIView):
    """Returns earnings summary for the dashboard."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        today = timezone.now().date()

        earnings_today = Transaction.objects.filter(
            user=user,
            created_at__date=today,
            status='completed',
        ).exclude(transaction_type='withdrawal').aggregate(
            total=__import__('django.db.models', fromlist=['Sum']).Sum('amount')
        )['total'] or 0

        total_transactions = Transaction.objects.filter(user=user, status='completed').count()

        return Response({
            'wallet_balance': float(user.wallet_balance),
            'total_earned': float(user.total_earned),
            'total_withdrawn': float(user.total_withdrawn),
            'points_balance': user.points_balance,
            'earnings_today': float(earnings_today),
            'total_transactions': total_transactions,
            'downline_count': user.get_downline_count(),
        })


# Import models needed in views
from django.db import models
