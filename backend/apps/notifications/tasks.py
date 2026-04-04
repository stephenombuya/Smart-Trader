"""
Notification tasks: Email, WebSocket push notifications.
"""
from celery import shared_task
import logging

logger = logging.getLogger(__name__)

@shared_task
def send_welcome_email(user_id: str):
    from django.contrib.auth import get_user_model
    from django.core.mail import send_mail
    from django.conf import settings

    User = get_user_model()
    try:
        user = User.objects.get(pk=user_id)

        send_mail(
            subject='Welcome to Smart Trader!',
            message=f'Hello {user.first_name},\n\nWelcome to Smart Trader! Your account is ready to go.\n\nStart earning now!',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
    except Exception as e:
        logger.error(f"Failed to send welcome email: {e}")



@shared_task
def send_verification_email(user_id: str):
    from django.contrib.auth import get_user_model
    from django.core.mail import send_mail
    from django.conf import settings

    User = get_user_model()
    try:
        user = User.objects.get(pk=user_id)
        token = user.verification_tokens.filter(used=False).latest('created_at')
        verify_url = f"{settings.FRONTEND_URL}/verify-email?token={token.token}"

        send_mail(
            subject='Verify your EarnChain account',
            message=f'Hello {user.first_name},\n\nClick to verify: {verify_url}\n\nThis link expires in 24 hours.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
        logger.info(f"Verification email sent to {user.email}")
    except Exception as e:
        logger.error(f"Failed to send verification email to user {user_id}: {e}")


@shared_task
def send_password_reset_email(user_id: str, token: str):
    from django.contrib.auth import get_user_model
    from django.core.mail import send_mail
    from django.conf import settings

    User = get_user_model()
    try:
        user = User.objects.get(pk=user_id)
        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"

        send_mail(
            subject='Reset your EarnChain password',
            message=f'Hello {user.first_name},\n\nReset your password: {reset_url}\n\nExpires in 1 hour.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
        )
    except Exception as e:
        logger.error(f"Failed to send reset email: {e}")


@shared_task
def send_withdrawal_notification(user_id: str, amount: float):
    from django.contrib.auth import get_user_model
    from django.core.mail import send_mail
    from django.conf import settings

    User = get_user_model()
    try:
        user = User.objects.get(pk=user_id)
        send_mail(
            subject='Withdrawal Successful — EarnChain',
            message=f'Hello {user.first_name},\n\nYour withdrawal of KES {amount:.2f} has been processed via M-Pesa.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
        )
        # Also send WebSocket notification
        push_user_notification.delay(user_id, {
            'type': 'withdrawal_success',
            'message': f'KES {amount:.2f} sent to your M-Pesa!',
        })
    except Exception as e:
        logger.error(f"Failed to send withdrawal notification: {e}")


@shared_task
def push_user_notification(user_id: str, payload: dict):
    """Push a real-time notification to a user via WebSocket."""
    from channels.layers import get_channel_layer
    from asgiref.sync import async_to_sync

    channel_layer = get_channel_layer()
    group_name = f'notifications_{user_id}'

    async_to_sync(channel_layer.group_send)(
        group_name,
        {
            'type': 'notification_message',
            'payload': payload,
        }
    )
