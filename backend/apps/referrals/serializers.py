from rest_framework import serializers
from .models import ReferralCommission


class ReferralCommissionSerializer(serializers.ModelSerializer):
    from_user_name = serializers.CharField(source='from_user.full_name', read_only=True)
    from_user_email = serializers.CharField(source='from_user.email', read_only=True)

    class Meta:
        model = ReferralCommission
        fields = [
            'id', 'from_user_name', 'from_user_email',
            'level', 'commission_rate', 'source_amount',
            'commission_amount', 'activity_type', 'created_at',
        ]
        read_only_fields = fields
