"""
Management command to seed mock users with referral relationships.
Usage: python manage.py seed_mock_users
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
import random


class Command(BaseCommand):
    help = 'Seed mock users with referral tree for testing'

    def handle(self, *args, **options):
        from django.contrib.auth import get_user_model
        from apps.referrals.services import ReferralService
        from apps.earnings.models import Transaction

        User = get_user_model()

        self.stdout.write('Creating mock users...')

        # Root user (top of tree)
        root, _ = User.objects.get_or_create(
            email='alice@test.com',
            defaults={
                'first_name': 'Alice',
                'last_name': 'Wanjiru',
                'is_active': True,
                'is_verified': True,
                'wallet_balance': 2450.00,
                'total_earned': 5200.00,
                'total_withdrawn': 2750.00,
            }
        )
        if _:
            root.set_password('Test@1234')
            root.save()
            ReferralService.register_user_in_tree(root)

        # Level 1 referrals
        level1_users = []
        for i, (first, last, email) in enumerate([
            ('Bob', 'Kamau', 'bob@test.com'),
            ('Carol', 'Njeri', 'carol@test.com'),
            ('David', 'Omondi', 'david@test.com'),
        ]):
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'first_name': first, 'last_name': last,
                    'referred_by': root,
                    'is_active': True, 'is_verified': True,
                    'wallet_balance': random.uniform(100, 800),
                    'total_earned': random.uniform(500, 2000),
                }
            )
            if created:
                user.set_password('Test@1234')
                user.save()
                ReferralService.register_user_in_tree(user)
            level1_users.append(user)

        # Level 2 referrals
        level2_users = []
        for parent in level1_users[:2]:
            for j in range(2):
                idx = len(level2_users) + j + 1
                email = f'level2_{idx}@test.com'
                user, created = User.objects.get_or_create(
                    email=email,
                    defaults={
                        'first_name': f'User', 'last_name': f'L2-{idx}',
                        'referred_by': parent,
                        'is_active': True, 'is_verified': True,
                        'wallet_balance': random.uniform(50, 300),
                        'total_earned': random.uniform(100, 600),
                    }
                )
                if created:
                    user.set_password('Test@1234')
                    user.save()
                    ReferralService.register_user_in_tree(user)
                level2_users.append(user)

        # Seed some transactions
        for user in [root] + level1_users + level2_users:
            for _ in range(random.randint(3, 10)):
                txn_type = random.choice(['ad_watch', 'spin_wheel', 'referral_commission'])
                amount = round(random.uniform(2, 50), 2)
                Transaction.objects.create(
                    user=user,
                    transaction_type=txn_type,
                    amount=amount,
                    status='completed',
                    description=f'Mock {txn_type} transaction',
                    created_at=timezone.now() - timedelta(days=random.randint(0, 30)),
                )

        self.stdout.write(self.style.SUCCESS(
            f'✅ Seeded {1 + len(level1_users) + len(level2_users)} users\n'
            f'   Root: alice@test.com / Test@1234\n'
            f'   Level 1: bob@test.com, carol@test.com, david@test.com\n'
            f'   Level 2: level2_1@test.com ... level2_4@test.com\n'
            f'   All passwords: Test@1234'
        ))
