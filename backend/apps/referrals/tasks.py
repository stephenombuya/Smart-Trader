from celery import shared_task
import logging

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def process_referral_commissions(self, user_id: str, earning_amount: float, activity_type: str):
    """Async task to calculate and distribute referral commissions."""
    try:
        from .services import ReferralService
        ReferralService.process_commissions(user_id, earning_amount, activity_type)
    except Exception as exc:
        logger.error(f"Commission processing failed for user {user_id}: {exc}")
        raise self.retry(exc=exc)
