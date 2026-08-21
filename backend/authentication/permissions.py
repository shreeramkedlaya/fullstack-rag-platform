from rest_framework.permissions import BasePermission
from authentication.models import SystemUser


class IsAdminForDelete(BasePermission):
    """
    Global permission class applied to every DRF view (set in REST_FRAMEWORK settings).

    Rules:
    - All requests require an active session (user_id present).
    - DELETE requests additionally require the user to have role='admin'.
    - GET / POST / PUT / PATCH are allowed for any authenticated user.

    Performance note:
    - user_role is read directly from the session (Redis, ~0.2ms).
    - No DB query is made here — role was cached into the session at login time
      by LoginView. This is the critical fix for the per-request DB hit that
      would become a bottleneck at scale.
    """
    message = "Only admins are allowed to perform this action."

    def has_permission(self, request, view):
        # 1. Try Token Mode (request.user is populated by SimpleJWT)
        if request.user and getattr(request.user, 'is_authenticated', False):
            if request.method == 'DELETE':
                return getattr(request.user, 'role', None) == 'admin'
            return True
            
        # 2. Try Session Mode (fallback)
        user_id = request.session.get('user_id')
        if not user_id:
            return False

        if request.method == 'DELETE':
            # Read role from session — no DB hit
            return request.session.get('user_role') == 'admin'

        return True
