"""
MLM Referral Tree Models using Materialized Path for efficient querying.
"""
import uuid
from django.db import models
from django.conf import settings


class ReferralNode(models.Model):
    """
    Represents a user's position in the MLM tree.
    Uses path-based hierarchy for efficient subtree queries.
    Example path: '00001.00003.00007.' (ancestor IDs separated by dots)
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='referral_node',
    )
    parent = models.ForeignKey(
        'self',
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='children',
    )
    path = models.TextField(default='')  # Materialized path
    depth = models.PositiveSmallIntegerField(default=0)  # Level in tree (0 = root)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'referral_nodes'
        indexes = [
            models.Index(fields=['path']),
            models.Index(fields=['parent']),
        ]

    def __str__(self):
        return f"Node[{self.user.email}] depth={self.depth}"

    def get_ancestors(self):
        """Return all ancestor nodes from root to parent."""
        if not self.path:
            return ReferralNode.objects.none()
        ancestor_ids = [p for p in self.path.rstrip('.').split('.') if p]
        return ReferralNode.objects.filter(pk__in=ancestor_ids).order_by('depth')

    def get_descendants(self, max_depth=None):
        """Return all descendant nodes."""
        qs = ReferralNode.objects.filter(path__startswith=self.path + str(self.pk) + '.')
        if max_depth is not None:
            qs = qs.filter(depth__lte=self.depth + max_depth)
        return qs

    def get_descendant_count(self):
        return self.get_descendants().count()

    def get_direct_referrals(self):
        return ReferralNode.objects.filter(parent=self)

    def get_level_descendants(self, level: int):
        """Get descendants at a specific level below this node."""
        target_depth = self.depth + level
        return ReferralNode.objects.filter(
            path__startswith=self.path + str(self.pk) + '.',
            depth=target_depth,
        )


class ReferralCommission(models.Model):
    """Record of each commission paid through the MLM tree."""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('cancelled', 'Cancelled'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    beneficiary = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='commissions_earned',
    )
    from_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='commissions_generated',
    )
    source_transaction = models.ForeignKey(
        'earnings.Transaction',
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='commissions',
    )
    level = models.PositiveSmallIntegerField()  # 1-5, which level in the tree
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2)  # %
    source_amount = models.DecimalField(max_digits=10, decimal_places=2)
    commission_amount = models.DecimalField(max_digits=10, decimal_places=2)
    activity_type = models.CharField(max_length=30)  # ad_watch, spin_wheel, etc.
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='paid')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'referral_commissions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['beneficiary', 'created_at']),
            models.Index(fields=['from_user']),
        ]

    def __str__(self):
        return f"Commission L{self.level}: {self.commission_amount} to {self.beneficiary.email}"
