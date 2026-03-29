from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.utils import timezone
from datetime import timedelta
from .models import User, EmailVerificationToken


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)
    referral_code = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'phone', 'password', 'password2', 'referral_code']

    def validate(self, attrs):
        if attrs['password'] != attrs.pop('password2'):
            raise serializers.ValidationError({'password': 'Passwords do not match'})
        return attrs

    def validate_referral_code(self, value):
        if value:
            try:
                User.objects.get(referral_code=value)
            except User.DoesNotExist:
                raise serializers.ValidationError('Invalid referral code')
        return value

    def create(self, validated_data):
        referral_code = validated_data.pop('referral_code', None)
        referred_by = None
        if referral_code:
            try:
                referred_by = User.objects.get(referral_code=referral_code)
            except User.DoesNotExist:
                pass

        user = User.objects.create_user(
            **validated_data,
            referred_by=referred_by
        )

        # Create verification token
        expires = timezone.now() + timedelta(hours=24)
        EmailVerificationToken.objects.create(user=user, expires_at=expires)

        # Trigger email (via Celery)
        from apps.notifications.tasks import send_verification_email
        send_verification_email.delay(str(user.id))

        # Register in MLM tree
        from apps.referrals.services import ReferralService
        ReferralService.register_user_in_tree(user)

        return user


class UserProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    downline_count = serializers.SerializerMethodField()
    referral_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'phone', 'avatar', 'referral_code', 'referral_url',
            'wallet_balance', 'total_earned', 'total_withdrawn',
            'points_balance', 'date_joined', 'downline_count',
            'mlm_level', 'is_verified',
        ]
        read_only_fields = [
            'id', 'email', 'referral_code', 'wallet_balance',
            'total_earned', 'total_withdrawn', 'points_balance',
            'date_joined', 'mlm_level',
        ]

    def get_downline_count(self, obj):
        return obj.get_downline_count()

    def get_referral_url(self, obj):
        from django.conf import settings
        return f"{settings.FRONTEND_URL}/register?ref={obj.referral_code}"


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    new_password2 = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError({'new_password': 'Passwords do not match'})
        return attrs


class WalletSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['wallet_balance', 'total_earned', 'total_withdrawn', 'points_balance']
        read_only_fields = fields
