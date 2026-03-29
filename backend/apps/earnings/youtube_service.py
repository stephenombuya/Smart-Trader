"""
YouTube Ad Tracking Service

⚠️  INTEGRATION REQUIRED FOR PRODUCTION
────────────────────────────────────────
The current implementation uses duration-based validation only.
For production, you need to integrate the YouTube Reporting API
to verify that users actually watched ads.

Steps to enable real YouTube tracking:
1. Enable YouTube Data API v3 in Google Cloud Console
2. Enable YouTube Reporting API
3. Set YOUTUBE_API_KEY in your .env
4. Implement the verify_watch() method below using the API

Resources:
- https://developers.google.com/youtube/v3/getting-started
- https://developers.google.com/youtube/reporting/v1/reports
"""
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class YouTubeService:
    def __init__(self):
        self.api_key = settings.YOUTUBE_API_KEY

    def get_video_details(self, video_id: str) -> dict:
        """
        Fetch video metadata from YouTube Data API v3.

        PRODUCTION: Uncomment and implement with real API call.
        """
        if not self.api_key:
            # Return mock data for development
            return {
                'id': video_id,
                'title': f'Mock Ad Video {video_id}',
                'duration': 'PT30S',  # ISO 8601 duration
                'thumbnail': f'https://img.youtube.com/vi/{video_id}/hqdefault.jpg',
            }

        # TODO: Implement real API call
        # import requests
        # url = 'https://www.googleapis.com/youtube/v3/videos'
        # params = {
        #     'key': self.api_key,
        #     'id': video_id,
        #     'part': 'snippet,contentDetails,statistics',
        # }
        # response = requests.get(url, params=params, timeout=10)
        # data = response.json()
        # item = data['items'][0]
        # return {
        #     'id': video_id,
        #     'title': item['snippet']['title'],
        #     'duration': item['contentDetails']['duration'],
        #     'thumbnail': item['snippet']['thumbnails']['high']['url'],
        # }

        raise NotImplementedError("YouTube API key not configured")

    def verify_watch(self, video_id: str, user_id: str, watch_duration: int) -> bool:
        """
        Verify that a user actually watched an ad.

        PRODUCTION: Use YouTube Analytics/Reporting API or a custom
        pixel/event to confirm real views. This prevents gaming the system.

        For now, falls back to duration check only.
        """
        logger.warning(
            "YouTube watch verification is using mock validation. "
            "Implement verify_watch() with real YouTube API for production."
        )
        # Mock: always returns True if duration is provided
        return watch_duration > 0
