"""
Earnings models: Transactions, YouTube Ad Watches, Spin Wheel, Tasks
"""
import uuid
from django.db import models
from django.conf import settings


class Transaction(models.Model):
    TRANSACTION_TYPES = [
        ('ad_watch', 'Ad Watch'),
        ('spin_wheel', 'Spin Wheel'),
        ('task_completion', 'Task Completion'),
        ('referral_commission', 'Referral Commission'),
        ('withdrawal', 'Withdrawal'),
        ('deposit', 'Deposit'),
        ('bonus', 'Bonus'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='transactions'
    )
    transaction_type = models.CharField(max_length=30, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    points = models.IntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='completed')
    description = models.TextField(blank=True)
    metadata = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'transactions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'transaction_type']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.transaction_type} - {self.amount}"


class YouTubeAd(models.Model):
    """Ads users can watch to earn points/money."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    youtube_video_id = models.CharField(max_length=50)  # YouTube video ID
    thumbnail_url = models.URLField(blank=True)
    reward_points = models.PositiveIntegerField(default=10)
    reward_amount = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    duration_seconds = models.PositiveIntegerField(default=30)  # Min watch time
    is_active = models.BooleanField(default=True)
    daily_limit_per_user = models.PositiveIntegerField(default=5)
    total_views = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'youtube_ads'

    def __str__(self):
        return self.title


class AdWatch(models.Model):
    """Record each time a user watches an ad."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='ad_watches'
    )
    ad = models.ForeignKey(YouTubeAd, on_delete=models.CASCADE, related_name='watches')
    watch_duration = models.PositiveIntegerField(default=0)  # seconds actually watched
    is_complete = models.BooleanField(default=False)
    rewarded = models.BooleanField(default=False)
    transaction = models.OneToOneField(
        Transaction, null=True, blank=True, on_delete=models.SET_NULL
    )
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'ad_watches'
        indexes = [
            models.Index(fields=['user', 'ad', 'created_at']),
        ]


class SpinWheelReward(models.Model):
    """Possible rewards on the spin wheel."""
    REWARD_TYPES = [
        ('cash', 'Cash (KES)'),
        ('points', 'Points'),
        ('free_spin', 'Free Spin'),
        ('nothing', 'No Reward'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    label = models.CharField(max_length=100)
    reward_type = models.CharField(max_length=20, choices=REWARD_TYPES)
    reward_value = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    probability = models.DecimalField(max_digits=5, decimal_places=4)  # e.g. 0.1000 = 10%
    color = models.CharField(max_length=7, default='#6366f1')  # hex color
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'spin_wheel_rewards'

    def __str__(self):
        return f"{self.label} ({self.probability*100:.1f}%)"


class SpinHistory(models.Model):
    """Log of user spin wheel events."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='spins'
    )
    reward = models.ForeignKey(SpinWheelReward, on_delete=models.PROTECT)
    transaction = models.OneToOneField(
        Transaction, null=True, blank=True, on_delete=models.SET_NULL
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'spin_history'
        ordering = ['-created_at']


class Task(models.Model):
    """Tasks users can complete to earn rewards."""
    TASK_TYPES = [
        ('survey', 'Survey'),
        ('signup', 'Sign Up on Partner Site'),
        ('social', 'Social Media Action'),
        ('download', 'App Download'),
        ('custom', 'Custom'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    description = models.TextField()
    task_type = models.CharField(max_length=20, choices=TASK_TYPES)
    reward_points = models.PositiveIntegerField(default=0)
    reward_amount = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    action_url = models.URLField(blank=True)
    is_active = models.BooleanField(default=True)
    max_completions = models.PositiveIntegerField(null=True, blank=True)  # null = unlimited
    current_completions = models.PositiveIntegerField(default=0)
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'tasks'

    def __str__(self):
        return self.title


class TaskCompletion(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='task_completions'
    )
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='completions')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    proof_url = models.URLField(blank=True)
    notes = models.TextField(blank=True)
    transaction = models.OneToOneField(
        Transaction, null=True, blank=True, on_delete=models.SET_NULL
    )
    completed_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'task_completions'
        unique_together = [('user', 'task')]
