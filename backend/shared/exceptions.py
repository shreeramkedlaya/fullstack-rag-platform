class ServiceValidationError(Exception):
    """
    Raised when serializer validation fails or payload formats are incorrect.
    Shared across all domain service layers.
    """
    def __init__(self, message, errors=None):
        self.message = message
        self.errors = errors
        super().__init__(self.message)


class ResourceNotFoundException(Exception):
    """
    Raised when a specific DB lookup fails and requires a customised error message.
    Shared across all domain service layers.
    """
    def __init__(self, message):
        self.message = message
        super().__init__(self.message)
