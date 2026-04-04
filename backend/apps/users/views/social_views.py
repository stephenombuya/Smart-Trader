"""
Google OAuth2 authentication endpoint.
Accepts a Google ID token from the frontend and returns JWT tokens.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from django.conf import settings
from django.contrib.auth import get_user_model
from apps.referrals.services import ReferralService

User = get_user_model()


class GoogleAuthView(APIView):
    permission_classes = []  # Public endpoint

    def post(self, request):
        # Debugging mode
        # 👀 DEBUG: see exactly what frontend sent
        print("Google login request data:", request.data)
        
        token = request.data.get('credential') or request.data.get('token')
        referral_code = request.data.get('referral_code', '')

        if not token:
            return Response({'error': 'Google token is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Verify the token with Google
            idinfo = id_token.verify_oauth2_token(
                token,
                google_requests.Request(),
                settings.GOOGLE_CLIENT_ID,
            )
        except ValueError as e:
            return Response({'error': f'Invalid Google token: {str(e)}'}, status=status.HTTP_401_UNAUTHORIZED)

        email      = idinfo.get('email')
        first_name = idinfo.get('given_name', '')
        last_name  = idinfo.get('family_name', '')
        google_id  = idinfo.get('sub')

        if not email:
            return Response({'error': 'Could not get email from Google'}, status=status.HTTP_400_BAD_REQUEST)

        # Get or create user
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'first_name': first_name,
                'last_name':  last_name,
                'is_active':  True,
                'is_verified': True,  # Google accounts are pre-verified
            }
        )

        if created:
            # Handle referral if code provided
            if referral_code:
                try:
                    referrer = User.objects.get(referral_code=referral_code)
                    user.referred_by = referrer
                    user.save(update_fields=['referred_by'])
                except User.DoesNotExist:
                    pass

            # Register in MLM tree
            ReferralService.register_user_in_tree(user)

            # Send welcome email
            from apps.notifications.tasks import send_welcome_email
            send_welcome_email.delay(str(user.id))
        else:
            # Update name if changed on Google side
            updated = False
            if first_name and user.first_name != first_name:
                user.first_name = first_name
                updated = True
            if last_name and user.last_name != last_name:
                user.last_name = last_name
                updated = True
            if updated:
                user.save(update_fields=['first_name', 'last_name'])

        # Issue JWT tokens
        refresh = RefreshToken.for_user(user)
        from apps.users.serializers import UserProfileSerializer
        return Response({
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
            'user':    UserProfileSerializer(user).data,
            'created': created,
        })