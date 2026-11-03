# GoswamiJodi API

## Authentication
POST `/api/auth/register`
```json
{"email":"arun@example.com","password":"Password123","phone":"9999999999","gender":"MALE"}
```

POST `/api/auth/login`
```json
{"email":"arun@example.com","password":"Password123"}
```

Use `Authorization: Bearer <token>` for protected endpoints.

## Profile
- GET `/api/profiles/me`
- PUT `/api/profiles/me`
- GET `/api/profiles/search?city=Delhi&religion=Hindu&profession=Java`
- GET `/api/profiles/user/{userId}`

## Partner preference
- GET `/api/preferences`
- PUT `/api/preferences`

## Photos
- GET `/api/photos`
- POST `/api/photos` multipart field `file`
- PATCH `/api/photos/{id}/primary`
- DELETE `/api/photos/{id}`
Maximum 10 photos per account.

## Requests
- POST `/api/requests/{userId}`
- GET `/api/requests/incoming`
- GET `/api/requests/outgoing`
- PATCH `/api/requests/{id}?status=ACCEPTED`

## Shortlist / Block
- POST `/api/shortlists/{userId}`
- DELETE `/api/shortlists/{userId}`
- GET `/api/shortlists`
- POST `/api/blocks/{userId}`
- DELETE `/api/blocks/{userId}`
- GET `/api/blocks`

## Chat
- GET `/api/chats/{otherUserId}/messages`
- POST `/api/chats/messages`
- WebSocket endpoint `/ws`, topic `/topic/chat/{userId}`

## Notifications
- GET `/api/notifications`
- GET `/api/notifications/unread-count`
- PATCH `/api/notifications/{id}/read`
