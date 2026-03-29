from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import generics
from django.contrib.auth import get_user_model

from .models import ReferralCommission
from .serializers import ReferralCommissionSerializer
from .services import ReferralService

User = get_user_model()


class ReferralTreeView(APIView):
    """Get the user's referral tree and team stats."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        stats = ReferralService.get_team_stats(str(user.id))

        # Direct referrals (level 1)
        direct_referrals = User.objects.filter(referred_by=user).values(
            'id', 'first_name', 'last_name', 'email',
            'date_joined', 'wallet_balance', 'total_earned',
        )

        return Response({
            'referral_code': user.referral_code,
            'referral_url': f"{request.build_absolute_uri('/')}{user.referral_code}",
            'team_stats': stats,
            'direct_referrals': list(direct_referrals),
        })


class CommissionHistoryView(generics.ListAPIView):
    """List user's commission earning history."""
    permission_classes = [IsAuthenticated]
    serializer_class = ReferralCommissionSerializer

    def get_queryset(self):
        return ReferralCommission.objects.filter(
            beneficiary=self.request.user
        ).select_related('from_user').order_by('-created_at')


class TeamPerformanceView(APIView):
    """Overview of team earnings performance."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.db.models import Sum, Count
        from django.utils import timezone
        from datetime import timedelta

        user = request.user
        thirty_days_ago = timezone.now() - timedelta(days=30)

        # Commissions earned in last 30 days by level
        commissions = ReferralCommission.objects.filter(
            beneficiary=user,
            created_at__gte=thirty_days_ago,
        ).values('level').annotate(
            total=Sum('commission_amount'),
            count=Count('id'),
        ).order_by('level')

        total_commissions = ReferralCommission.objects.filter(
            beneficiary=user
        ).aggregate(total=Sum('commission_amount'))['total'] or 0

        return Response({
            'commissions_last_30_days': list(commissions),
            'total_commissions_all_time': float(total_commissions),
            'team_size': user.get_downline_count(),
        })
