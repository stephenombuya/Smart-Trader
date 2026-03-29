"""
WebSocket consumer for real-time spin wheel and notifications.
"""
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async


class SpinWheelConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope['user']
        if self.user.is_anonymous:
            await self.close()
            return

        self.group_name = f'spin_{self.user.id}'
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        await self.send(text_data=json.dumps({
            'type': 'connected',
            'message': 'Spin wheel connected',
        }))

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        msg_type = data.get('type')

        if msg_type == 'spin_start':
            await self.send(text_data=json.dumps({
                'type': 'spin_animation',
                'message': 'Spinning...',
            }))

    async def spin_result(self, event):
        """Called when a spin result is broadcast to this user's group."""
        await self.send(text_data=json.dumps({
            'type': 'spin_result',
            'reward': event['reward'],
            'message': event['message'],
        }))
