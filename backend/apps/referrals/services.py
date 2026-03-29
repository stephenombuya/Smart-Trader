"""
MLM Referral Service — Commission Calculation Engine
Handles tree registration and multi-level commission payouts.
"""
from decimal import Decimal
import logging
from django.conf import settings
from django.db import transaction as db_transaction

logger = logging.getLogger(__name__)


class ReferralService:
    MAX_LEVELS = 5

    @classmethod
    def register_user_in_tree(cls, user):
        """
        Register a new user in the MLM referral tree.
        Called immediately after registration.
        """
        from .models import ReferralNode

        parent_node = None
        path = ''
        depth = 0

        if user.referred_by:
            try:
                parent_node = ReferralNode.objects.get(user=user.referred_by)
                path = parent_node.path + str(parent_node.pk) + '.'
                depth = parent_node.depth + 1
            except ReferralNode.DoesNotExist:
                logger.warning(f"Parent node not found for referrer {user.referred_by_id}")

        node = ReferralNode.objects.create(
            user=user,
            parent=parent_node,
            path=path,
            depth=depth,
        )

        # Update user mlm_level
        type(user).objects.filter(pk=user.pk).update(mlm_level=depth)
        logger.info(f"Registered {user.email} in referral tree at depth {depth}")
        return node

    @classmethod
    def process_commissions(cls, user_id: str, earning_amount: float, activity_type: str):
        """
        Walk up the referral tree up to MAX_LEVELS and credit commissions.

        Args:
            user_id: The user who triggered the earning event
            earning_amount: The base amount earned (KES)
            activity_type: 'ad_watch', 'spin_wheel', 'task_completion', etc.
        """
        from django.contrib.auth import get_user_model
        from .models import ReferralNode, ReferralCommission
        from apps.earnings.models import Transaction

        User = get_user_model()
        amount = Decimal(str(earning_amount))

        if amount <= 0:
            return

        try:
            node = ReferralNode.objects.select_related('user').get(user_id=user_id)
        except ReferralNode.DoesNotExist:
            logger.warning(f"No referral node for user {user_id}")
            return

        commission_rates = settings.COMMISSION_RATES  # {1: 10, 2: 5, 3: 3, 4: 2, 5: 1}

        # Walk up the tree
        ancestors = node.get_ancestors().select_related('user').order_by('depth')
        level = 1

        # Build ordered ancestor list from direct parent outward
        ancestor_list = list(ancestors)
        ancestor_list.reverse()  # nearest first

        with db_transaction.atomic():
            for ancestor_node in ancestor_list:
                if level > cls.MAX_LEVELS:
                    break

                rate = commission_rates.get(level, 0)
                if rate == 0:
                    level += 1
                    continue

                commission_amount = (amount * Decimal(rate)) / Decimal(100)
                if commission_amount <= 0:
                    level += 1
                    continue

                beneficiary = ancestor_node.user

                # Create commission transaction
                txn = Transaction.objects.create(
                    user=beneficiary,
                    transaction_type='referral_commission',
                    amount=commission_amount,
                    status='completed',
                    description=f'Level {level} commission from {activity_type}',
                    metadata={
                        'from_user_id': user_id,
                        'level': level,
                        'rate': rate,
                        'activity_type': activity_type,
                    },
                )

                # Credit beneficiary's wallet
                beneficiary.credit_wallet(commission_amount, f'L{level} referral commission')

                # Record commission
                ReferralCommission.objects.create(
                    beneficiary=beneficiary,
                    from_user_id=user_id,
                    source_transaction=txn,
                    level=level,
                    commission_rate=rate,
                    source_amount=amount,
                    commission_amount=commission_amount,
                    activity_type=activity_type,
                )

                logger.info(
                    f"Commission L{level}: {commission_amount} KES to {beneficiary.email} "
                    f"from {activity_type} by user {user_id}"
                )
                level += 1

    @classmethod
    def get_team_stats(cls, user_id: str) -> dict:
        """Return team size and earnings stats per level."""
        from .models import ReferralNode, ReferralCommission
        from django.db.models import Sum, Count

        try:
            node = ReferralNode.objects.get(user_id=user_id)
        except ReferralNode.DoesNotExist:
            return {'levels': [], 'total_team': 0}

        levels = []
        for level in range(1, cls.MAX_LEVELS + 1):
            descendants = node.get_level_descendants(level)
            count = descendants.count()
            commissions = ReferralCommission.objects.filter(
                beneficiary_id=user_id, level=level
            ).aggregate(
                total=Sum('commission_amount'),
                count=Count('id'),
            )
            levels.append({
                'level': level,
                'member_count': count,
                'total_commissions': float(commissions['total'] or 0),
                'commission_count': commissions['count'],
                'commission_rate': settings.COMMISSION_RATES.get(level, 0),
            })

        return {
            'levels': levels,
            'total_team': node.get_descendant_count(),
        }
