from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from apps.earnings.models import Transaction
import logging

logger = logging.getLogger(__name__)


class MpesaCallbackView(APIView):
    """
    Handles M-Pesa STK Push callback from Safaricom.
    This endpoint must be publicly accessible (no auth required).
    """
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data
        logger.info(f"M-Pesa callback received: {data}")

        try:
            body = data.get('Body', {}).get('stkCallback', {})
            result_code = body.get('ResultCode')
            checkout_request_id = body.get('CheckoutRequestID')

            # Find the transaction
            txn = Transaction.objects.get(
                metadata__mpesa_checkout_request_id=checkout_request_id
            )

            if result_code == 0:
                # Success
                callback_metadata = body.get('CallbackMetadata', {}).get('Item', [])
                mpesa_receipt = next(
                    (item['Value'] for item in callback_metadata if item['Name'] == 'MpesaReceiptNumber'),
                    None
                )
                txn.status = 'completed'
                txn.metadata['mpesa_receipt'] = mpesa_receipt
                txn.save(update_fields=['status', 'metadata'])

                # Notify user
                from apps.notifications.tasks import send_withdrawal_notification
                send_withdrawal_notification.delay(str(txn.user_id), float(txn.amount))
            else:
                # Failed — refund wallet
                txn.status = 'failed'
                txn.metadata['failure_reason'] = body.get('ResultDesc', 'Unknown error')
                txn.save(update_fields=['status', 'metadata'])
                txn.user.credit_wallet(txn.amount, 'Withdrawal refund - M-Pesa failed')

        except Transaction.DoesNotExist:
            logger.error(f"Transaction not found for checkout request: {checkout_request_id}")
        except Exception as e:
            logger.exception(f"M-Pesa callback error: {e}")

        # Always return 200 to Safaricom
        return Response({'ResultCode': 0, 'ResultDesc': 'Success'})


class WithdrawalStatusView(APIView):
    """Check status of a specific withdrawal transaction."""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            txn = Transaction.objects.get(pk=pk, user=request.user, transaction_type='withdrawal')
        except Transaction.DoesNotExist:
            return Response({'error': 'Transaction not found'}, status=404)

        from apps.earnings.serializers import TransactionSerializer
        return Response(TransactionSerializer(txn).data)
