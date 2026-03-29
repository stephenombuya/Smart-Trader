"""
Test suite for EarnChain MLM Platform.
Run with: python manage.py test
"""
from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()


# ─── User & Auth Tests ────────────────────────────────────────────────────────

class UserRegistrationTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = '/api/auth/register/'

    def test_register_new_user(self):
        data = {
            'email': 'test@example.com',
            'first_name': 'John',
            'last_name': 'Doe',
            'password': 'SecurePass123!',
            'password2': 'SecurePass123!',
        }
        res = self.client.post(self.register_url, data)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn('email', res.data)
        self.assertTrue(User.objects.filter(email='test@example.com').exists())

    def test_register_duplicate_email(self):
        User.objects.create_user(email='dup@example.com', password='pass', first_name='A', last_name='B')
        data = {
            'email': 'dup@example.com',
            'first_name': 'A', 'last_name': 'B',
            'password': 'SecurePass123!', 'password2': 'SecurePass123!',
        }
        res = self.client.post(self.register_url, data)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_password_mismatch(self):
        data = {
            'email': 'new@example.com',
            'first_name': 'A', 'last_name': 'B',
            'password': 'SecurePass123!', 'password2': 'WrongPass!',
        }
        res = self.client.post(self.register_url, data)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_with_referral_code(self):
        referrer = User.objects.create_user(
            email='ref@example.com', password='pass', first_name='Ref', last_name='User',
            is_active=True, is_verified=True,
        )
        data = {
            'email': 'newbie@example.com',
            'first_name': 'New', 'last_name': 'Bie',
            'password': 'SecurePass123!', 'password2': 'SecurePass123!',
            'referral_code': referrer.referral_code,
        }
        res = self.client.post(self.register_url, data)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        new_user = User.objects.get(email='newbie@example.com')
        self.assertEqual(new_user.referred_by, referrer)

    def test_invalid_referral_code(self):
        data = {
            'email': 'x@example.com',
            'first_name': 'X', 'last_name': 'Y',
            'password': 'SecurePass123!', 'password2': 'SecurePass123!',
            'referral_code': 'INVALID99',
        }
        res = self.client.post(self.register_url, data)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


class AuthLoginTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='login@example.com', password='Pass1234!',
            first_name='Login', last_name='User',
            is_active=True, is_verified=True,
        )

    def test_login_success(self):
        res = self.client.post('/api/auth/login/', {
            'email': 'login@example.com', 'password': 'Pass1234!'
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('access', res.data)
        self.assertIn('refresh', res.data)

    def test_login_wrong_password(self):
        res = self.client.post('/api/auth/login/', {
            'email': 'login@example.com', 'password': 'WrongPass!'
        })
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_unverified_account(self):
        User.objects.create_user(
            email='unverified@example.com', password='Pass1234!',
            first_name='Un', last_name='Verified', is_active=False,
        )
        res = self.client.post('/api/auth/login/', {
            'email': 'unverified@example.com', 'password': 'Pass1234!'
        })
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)


# ─── Wallet Tests ─────────────────────────────────────────────────────────────

class WalletTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='wallet@example.com', password='pass',
            first_name='Wallet', last_name='Test',
            is_active=True, is_verified=True,
        )

    def test_credit_wallet(self):
        self.user.credit_wallet(Decimal('100.00'), 'Test credit')
        self.user.refresh_from_db()
        self.assertEqual(self.user.wallet_balance, Decimal('100.00'))
        self.assertEqual(self.user.total_earned, Decimal('100.00'))

    def test_debit_wallet_success(self):
        self.user.wallet_balance = Decimal('500.00')
        self.user.save()
        self.user.debit_wallet(Decimal('200.00'))
        self.user.refresh_from_db()
        self.assertEqual(self.user.wallet_balance, Decimal('300.00'))

    def test_debit_wallet_insufficient_funds(self):
        self.user.wallet_balance = Decimal('50.00')
        self.user.save()
        with self.assertRaises(ValueError):
            self.user.debit_wallet(Decimal('200.00'))

    def test_wallet_api_requires_auth(self):
        client = APIClient()
        res = client.get('/api/users/wallet/')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


# ─── Referral / Commission Tests ──────────────────────────────────────────────

class ReferralTreeTest(TestCase):
    def setUp(self):
        from apps.referrals.services import ReferralService
        # Build a 3-level tree
        self.root   = User.objects.create_user(email='root@ex.com',   password='p', first_name='Root',   last_name='User', is_active=True)
        self.level1 = User.objects.create_user(email='l1@ex.com',     password='p', first_name='Level1', last_name='User', referred_by=self.root, is_active=True)
        self.level2 = User.objects.create_user(email='l2@ex.com',     password='p', first_name='Level2', last_name='User', referred_by=self.level1, is_active=True)
        self.level3 = User.objects.create_user(email='l3@ex.com',     password='p', first_name='Level3', last_name='User', referred_by=self.level2, is_active=True)

        for u in [self.root, self.level1, self.level2, self.level3]:
            ReferralService.register_user_in_tree(u)

    def test_tree_registered(self):
        from apps.referrals.models import ReferralNode
        self.assertEqual(ReferralNode.objects.count(), 4)

    def test_root_depth_is_zero(self):
        from apps.referrals.models import ReferralNode
        root_node = ReferralNode.objects.get(user=self.root)
        self.assertEqual(root_node.depth, 0)

    def test_descendant_depth(self):
        from apps.referrals.models import ReferralNode
        l3_node = ReferralNode.objects.get(user=self.level3)
        self.assertEqual(l3_node.depth, 3)

    def test_commission_flows_up_3_levels(self):
        from apps.referrals.services import ReferralService
        from apps.referrals.models import ReferralCommission

        # Level3 earns KES 100 from an ad watch
        ReferralService.process_commissions(str(self.level3.id), 100.0, 'ad_watch')

        # Level2 should get L1 commission (10%)
        l2_comm = ReferralCommission.objects.filter(beneficiary=self.level2, level=1).first()
        self.assertIsNotNone(l2_comm)
        self.assertAlmostEqual(float(l2_comm.commission_amount), 10.0, places=2)

        # Level1 should get L2 commission (5%)
        l1_comm = ReferralCommission.objects.filter(beneficiary=self.level1, level=2).first()
        self.assertIsNotNone(l1_comm)
        self.assertAlmostEqual(float(l1_comm.commission_amount), 5.0, places=2)

        # Root should get L3 commission (3%)
        root_comm = ReferralCommission.objects.filter(beneficiary=self.root, level=3).first()
        self.assertIsNotNone(root_comm)
        self.assertAlmostEqual(float(root_comm.commission_amount), 3.0, places=2)

    def test_commission_credits_wallet(self):
        from apps.referrals.services import ReferralService

        self.root.refresh_from_db()
        initial = self.root.wallet_balance

        ReferralService.process_commissions(str(self.level3.id), 100.0, 'ad_watch')

        self.root.refresh_from_db()
        # Root should have received level-3 commission (3%)
        self.assertGreater(self.root.wallet_balance, initial)

    def test_commission_respects_max_5_levels(self):
        from apps.referrals.services import ReferralService
        from apps.referrals.models import ReferralCommission

        # Add a level-6 user (should receive NO commission)
        l4 = User.objects.create_user(email='l4@ex.com', password='p', first_name='L4', last_name='U', referred_by=self.level3, is_active=True)
        l5 = User.objects.create_user(email='l5@ex.com', password='p', first_name='L5', last_name='U', referred_by=l4, is_active=True)
        l6 = User.objects.create_user(email='l6@ex.com', password='p', first_name='L6', last_name='U', referred_by=l5, is_active=True)

        for u in [l4, l5, l6]:
            ReferralService.register_user_in_tree(u)

        ReferralService.process_commissions(str(l6.id), 100.0, 'ad_watch')

        # Root is 6 levels above l6, should get nothing
        root_comms = ReferralCommission.objects.filter(beneficiary=self.root)
        self.assertEqual(root_comms.count(), 0)

    def test_team_stats(self):
        from apps.referrals.services import ReferralService
        stats = ReferralService.get_team_stats(str(self.root.id))
        self.assertEqual(stats['total_team'], 3)  # l1, l2, l3

    def test_get_referral_chain(self):
        chain = self.level3.get_referral_chain(max_levels=5)
        # level3 -> level2 -> level1 -> root
        self.assertEqual(len(chain), 3)
        self.assertEqual(chain[0][1], self.level2)
        self.assertEqual(chain[1][1], self.level1)
        self.assertEqual(chain[2][1], self.root)


# ─── Spin Wheel Tests ─────────────────────────────────────────────────────────

class SpinWheelTest(TestCase):
    def setUp(self):
        from apps.earnings.models import SpinWheelReward
        self.user = User.objects.create_user(
            email='spin@example.com', password='pass',
            first_name='Spin', last_name='User',
            is_active=True, is_verified=True,
        )
        # Create rewards totalling 100% probability
        SpinWheelReward.objects.create(label='KES 10',    reward_type='cash',    reward_value=10,  probability='0.2000', color='#22c55e')
        SpinWheelReward.objects.create(label='50 Points', reward_type='points',  reward_value=50,  probability='0.3000', color='#6366f1')
        SpinWheelReward.objects.create(label='Try Again', reward_type='nothing', reward_value=0,   probability='0.5000', color='#6b7280')

        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_spin_config_returns_rewards(self):
        res = self.client.get('/api/earnings/spin/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('rewards', res.data)
        self.assertEqual(len(res.data['rewards']), 3)

    def test_free_spin_available(self):
        res = self.client.get('/api/earnings/spin/')
        self.assertEqual(res.data['free_spins_remaining'], 1)

    def test_execute_spin_returns_reward(self):
        res = self.client.post('/api/earnings/spin/execute/', {})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('reward', res.data)
        self.assertIn('message', res.data)

    def test_second_free_spin_blocked(self):
        self.client.post('/api/earnings/spin/execute/', {})  # Use free spin
        res = self.client.post('/api/earnings/spin/execute/', {'use_points': False})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


# ─── API Authorization Tests ──────────────────────────────────────────────────

class AuthorizationTest(TestCase):
    PROTECTED_ENDPOINTS = [
        ('GET',  '/api/users/profile/'),
        ('GET',  '/api/users/wallet/'),
        ('GET',  '/api/earnings/dashboard/'),
        ('GET',  '/api/earnings/ads/'),
        ('GET',  '/api/earnings/spin/'),
        ('GET',  '/api/earnings/tasks/'),
        ('GET',  '/api/referrals/tree/'),
        ('GET',  '/api/referrals/commissions/'),
        ('GET',  '/api/notifications/'),
    ]

    def setUp(self):
        self.client = APIClient()  # Unauthenticated

    def test_all_protected_endpoints_require_auth(self):
        for method, url in self.PROTECTED_ENDPOINTS:
            with self.subTest(url=url):
                fn = getattr(self.client, method.lower())
                res = fn(url)
                self.assertEqual(
                    res.status_code, status.HTTP_401_UNAUTHORIZED,
                    f"{method} {url} should require authentication"
                )

    def test_admin_endpoint_requires_staff(self):
        regular_user = User.objects.create_user(
            email='regular@ex.com', password='pass',
            first_name='R', last_name='U', is_active=True,
        )
        self.client.force_authenticate(user=regular_user)
        res = self.client.get('/api/admin-panel/dashboard/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
