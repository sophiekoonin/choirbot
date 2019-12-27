# SHEBot

A helpful little Slack bot for SHE Choir to take attendance and remind us about rehearsals.

## Installation

Slack permissions needed:

Bot token

- chat:write
- channels:history
- channels:read
- channels:join
- reactions:read
- reactions:write
- emoji:read
- users:read
- users:profile:read

Configure interactions and events with the endpoints `/interactions` and `/events` respectively.

Subscribe to the `app_home_opened` event.
