import uuid
from django.db import models
from django.conf import settings


class Notification(models.Model):
    TYPES = [
        ('commission', 'Commission Earned'),
        ('withdrawal_success', 'Withdrawal Success'),
        ('withdrawal_failed', 'Withdrawal Failed'),
        ('spin_reward', 'Spin Reward'),
        ('task_approved', 'Task Approved'),
        ('new_referral', 'New Referral'),
        ('general', 'General'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications'
    )
    notification_type = models.CharField(max_length=30, choices=TYPES, default='general')
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    metadata = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} - {self.title}"
