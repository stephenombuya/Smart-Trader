from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter

from ..models import User
from ..serializers import UserProfileSerializer, WalletSerializer
from apps.earnings.models import Transaction


class UserProfileView(generics.RetrieveUpdateAPIView):
    """Get or update authenticated user's profile."""
    permission_classes = [IsAuthenticated]
    serializer_class = UserProfileSerializer

    def get_object(self):
        return self.request.user


class UserWalletView(APIView):
    """Get wallet summary for authenticated user."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        recent_transactions = Transaction.objects.filter(user=user).order_by('-created_at')[:10]
        from apps.earnings.serializers import TransactionSerializer
        return Response({
            'wallet': WalletSerializer(user).data,
            'recent_transactions': TransactionSerializer(recent_transactions, many=True).data,
        })


class UserActivityView(generics.ListAPIView):
    """List user activity/transaction history."""
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['transaction_type', 'status']
    ordering_fields = ['created_at', 'amount']
    ordering = ['-created_at']

    def get_queryset(self):
        from apps.earnings.models import Transaction
        return Transaction.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        from apps.earnings.serializers import TransactionSerializer
        return TransactionSerializer


class UserListView(generics.ListAPIView):
    """Admin: List all users."""
    permission_classes = [IsAdminUser]
    serializer_class = UserProfileSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['is_active', 'is_verified']
    ordering = ['-date_joined']
    queryset = User.objects.all()


class WithdrawalRequestView(APIView):
    """Request an M-Pesa withdrawal."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from django.conf import settings
        from apps.users.services.mpesa_service import MpesaService
        from apps.earnings.models import Transaction

        amount = request.data.get('amount')
        phone = request.data.get('phone', request.user.phone)

        if not amount or not phone:
            return Response({'error': 'Amount and phone are required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            amount = int(amount)
        except (ValueError, TypeError):
            return Response({'error': 'Invalid amount'}, status=status.HTTP_400_BAD_REQUEST)

        if amount < settings.MIN_WITHDRAWAL_AMOUNT:
            return Response(
                {'error': f'Minimum withdrawal is KES {settings.MIN_WITHDRAWAL_AMOUNT}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = request.user
        if user.wallet_balance < amount:
            return Response({'error': 'Insufficient wallet balance'}, status=status.HTTP_400_BAD_REQUEST)

        # Debit wallet and create pending transaction
        try:
            user.debit_wallet(amount)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        txn = Transaction.objects.create(
            user=user,
            transaction_type='withdrawal',
            amount=amount,
            status='pending',
            description=f'M-Pesa withdrawal to {phone}',
            metadata={'phone': phone},
        )

        # Trigger M-Pesa STK Push
        try:
            mpesa = MpesaService()
            result = mpesa.stk_push(phone=phone, amount=amount, reference=str(txn.id))
            txn.metadata['mpesa_checkout_request_id'] = result.get('CheckoutRequestID')
            txn.save(update_fields=['metadata'])
        except Exception as e:
            # Refund on failure
            user.credit_wallet(amount, 'Withdrawal refund - M-Pesa error')
            txn.status = 'failed'
            txn.save(update_fields=['status'])
            return Response({'error': 'M-Pesa request failed. Please try again.'}, status=status.HTTP_502_BAD_GATEWAY)

        return Response({
            'message': 'Withdrawal initiated. Check your phone for the M-Pesa prompt.',
            'transaction_id': str(txn.id),
        })
