"""
M-Pesa Daraja API Service
Handles STK Push (Lipa Na M-Pesa Online) for withdrawals/deposits.
"""
import base64
import requests
from datetime import datetime
from django.conf import settings


class MpesaService:
    SANDBOX_BASE_URL = 'https://sandbox.safaricom.co.ke'
    PRODUCTION_BASE_URL = 'https://api.safaricom.co.ke'

    def __init__(self):
        self.env = settings.MPESA_ENV
        self.base_url = self.SANDBOX_BASE_URL if self.env == 'sandbox' else self.PRODUCTION_BASE_URL
        self.consumer_key = settings.MPESA_CONSUMER_KEY
        self.consumer_secret = settings.MPESA_CONSUMER_SECRET
        self.shortcode = settings.MPESA_SHORTCODE
        self.passkey = settings.MPESA_PASSKEY
        self.callback_url = settings.MPESA_CALLBACK_URL

    def get_access_token(self):
        """Get OAuth access token from Safaricom."""
        url = f"{self.base_url}/oauth/v1/generate?grant_type=client_credentials"
        credentials = base64.b64encode(f"{self.consumer_key}:{self.consumer_secret}".encode()).decode()
        response = requests.get(url, headers={'Authorization': f'Basic {credentials}'}, timeout=30)
        response.raise_for_status()
        return response.json()['access_token']

    def get_password(self):
        """Generate STK Push password."""
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        raw = f"{self.shortcode}{self.passkey}{timestamp}"
        password = base64.b64encode(raw.encode()).decode()
        return password, timestamp

    def stk_push(self, phone: str, amount: int, reference: str):
        """
        Initiate STK Push payment request.

        Args:
            phone: Phone in format 254XXXXXXXXX
            amount: Amount in KES (integer)
            reference: Unique transaction reference

        Returns:
            dict with CheckoutRequestID etc.
        """
        # Normalize phone number
        phone = phone.strip().replace('+', '').replace(' ', '')
        if phone.startswith('0'):
            phone = '254' + phone[1:]
        if not phone.startswith('254'):
            phone = '254' + phone

        access_token = self.get_access_token()
        password, timestamp = self.get_password()

        payload = {
            'BusinessShortCode': self.shortcode,
            'Password': password,
            'Timestamp': timestamp,
            'TransactionType': 'CustomerPayBillOnline',
            'Amount': amount,
            'PartyA': phone,
            'PartyB': self.shortcode,
            'PhoneNumber': phone,
            'CallBackURL': self.callback_url,
            'AccountReference': f'EarnChain-{reference[:8]}',
            'TransactionDesc': 'EarnChain Withdrawal',
        }

        url = f"{self.base_url}/mpesa/stkpush/v1/processrequest"
        response = requests.post(
            url,
            json=payload,
            headers={
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json',
            },
            timeout=30,
        )
        response.raise_for_status()
        return response.json()

    def query_stk_status(self, checkout_request_id: str):
        """Query the status of an STK Push transaction."""
        access_token = self.get_access_token()
        password, timestamp = self.get_password()

        payload = {
            'BusinessShortCode': self.shortcode,
            'Password': password,
            'Timestamp': timestamp,
            'CheckoutRequestID': checkout_request_id,
        }

        url = f"{self.base_url}/mpesa/stkpushquery/v1/query"
        response = requests.post(
            url,
            json=payload,
            headers={'Authorization': f'Bearer {access_token}'},
            timeout=30,
        )
        return response.json()
