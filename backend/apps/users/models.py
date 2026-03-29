"""
Custom User Model with MLM referral support
"""
import uuid
import shortuuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.utils import timezone


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        extra_fields.setdefault('is_active', False)  # Requires email verification
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('is_verified', True)
        return self.create_user(email, password, **extra_fields)


def generate_referral_code():
    return shortuuid.ShortUUID(alphabet="ABCDEFGHJKLMNPQRSTUVWXYZ23456789").random(length=8)


class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20, blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)

    # Auth flags
    is_active = models.BooleanField(default=False)  # email not yet verified
    is_staff = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)
    last_login = models.DateTimeField(null=True, blank=True)

    # MLM
    referral_code = models.CharField(max_length=20, unique=True, default=generate_referral_code)
    referred_by = models.ForeignKey(
        'self', null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='direct_referrals'
    )
    mlm_level = models.PositiveSmallIntegerField(default=0)  # Calculated level in tree

    # Wallet
    wallet_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total_earned = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total_withdrawn = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    points_balance = models.PositiveIntegerField(default=0)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    objects = UserManager()

    class Meta:
        db_table = 'users'
        indexes = [
            models.Index(fields=['referral_code']),
            models.Index(fields=['referred_by']),
            models.Index(fields=['email']),
        ]

    def __str__(self):
        return f"{self.full_name} <{self.email}>"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def get_referral_chain(self, max_levels=5):
        """Returns list of ancestors up to max_levels."""
        chain = []
        current = self.referred_by
        level = 1
        while current and level <= max_levels:
            chain.append((level, current))
            current = current.referred_by
            level += 1
        return chain

    def get_downline_count(self):
        """Count total team members across all levels."""
        from apps.referrals.models import ReferralNode
        try:
            node = self.referral_node
            return node.get_descendant_count()
        except Exception:
            return 0

    def credit_wallet(self, amount, description=''):
        """Safely add to wallet balance."""
        from django.db.models import F
        User.objects.filter(pk=self.pk).update(
            wallet_balance=F('wallet_balance') + amount,
            total_earned=F('total_earned') + amount,
        )
        self.refresh_from_db()

    def debit_wallet(self, amount):
        """Safely deduct from wallet (raises if insufficient)."""
        from django.db.models import F
        if self.wallet_balance < amount:
            raise ValueError("Insufficient wallet balance")
        User.objects.filter(pk=self.pk).update(
            wallet_balance=F('wallet_balance') - amount,
            total_withdrawn=F('total_withdrawn') + amount,
        )
        self.refresh_from_db()


class EmailVerificationToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='verification_tokens')
    token = models.UUIDField(default=uuid.uuid4, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)

    class Meta:
        db_table = 'email_verification_tokens'

    def is_valid(self):
        return not self.used and timezone.now() < self.expires_at


class PasswordResetToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reset_tokens')
    token = models.UUIDField(default=uuid.uuid4, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)

    class Meta:
        db_table = 'password_reset_tokens'
