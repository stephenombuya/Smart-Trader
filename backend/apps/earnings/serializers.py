from rest_framework import serializers
from .models import Transaction, YouTubeAd, AdWatch, SpinWheelReward, SpinHistory, Task, TaskCompletion


class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = [
            'id', 'transaction_type', 'amount', 'points', 'status',
            'description', 'metadata', 'created_at',
        ]
        read_only_fields = fields


class YouTubeAdSerializer(serializers.ModelSerializer):
    embed_url = serializers.SerializerMethodField()

    class Meta:
        model = YouTubeAd
        fields = [
            'id', 'title', 'youtube_video_id', 'thumbnail_url',
            'reward_points', 'reward_amount', 'duration_seconds',
            'daily_limit_per_user', 'embed_url',
        ]

    def get_embed_url(self, obj):
        return f"https://www.youtube.com/embed/{obj.youtube_video_id}?autoplay=1&controls=0&disablekb=1"


class AdWatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdWatch
        fields = ['id', 'ad', 'watch_duration', 'is_complete', 'rewarded', 'created_at']
        read_only_fields = ['id', 'is_complete', 'rewarded', 'created_at']


class SpinWheelRewardSerializer(serializers.ModelSerializer):
    class Meta:
        model = SpinWheelReward
        fields = ['id', 'label', 'reward_type', 'reward_value', 'probability', 'color']


class SpinHistorySerializer(serializers.ModelSerializer):
    reward = SpinWheelRewardSerializer(read_only=True)

    class Meta:
        model = SpinHistory
        fields = ['id', 'reward', 'created_at']
        read_only_fields = fields


class TaskSerializer(serializers.ModelSerializer):
    is_completed_by_user = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'task_type',
            'reward_points', 'reward_amount', 'action_url',
            'expires_at', 'is_completed_by_user',
        ]

    def get_is_completed_by_user(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return TaskCompletion.objects.filter(user=request.user, task=obj).exists()
        return False


class TaskCompletionSerializer(serializers.ModelSerializer):
    task = TaskSerializer(read_only=True)

    class Meta:
        model = TaskCompletion
        fields = ['id', 'task', 'status', 'proof_url', 'notes', 'completed_at']
        read_only_fields = ['id', 'status', 'completed_at']
