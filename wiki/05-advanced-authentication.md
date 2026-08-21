# 🔐 Advanced Session & Authentication

## The Opaque Token Pattern
To prevent XSS (Cross-Site Scripting), JWT Refresh Tokens are **never** stored in `localStorage`.
- Instead, the backend stores the refresh token in Redis.
- A pointer called `transaction_id` is issued as an `HttpOnly` cookie.
- An `access_token` (10m lifespan) is issued as an `HttpOnly` cookie.

## Proactive "Silent" Refresh Cycle
- The frontend stores an `access_exp` timestamp in `localStorage`.
- An Axios interceptor checks if the token expires within 120 seconds before *every* request.
- If it does, it pauses the request, silently hits `POST /auth/token/refresh/`, gets new cookies, and resumes.

## Device Limits & Kill Switches
- Redis strictly caps user sessions to 3 devices using a FIFO list.
- If a user logs into a 4th device, the 1st device's session pointer is deleted.
- The next time the 1st device tries to refresh, it gets a 401 Unauthorized, and the React frontend forcefully logs the user out.
