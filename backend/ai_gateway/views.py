from django.http import JsonResponse, HttpResponse
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
import requests
import os

FASTAPI_BASE_URL = "http://127.0.0.1:8001"

class AIGatewayProxyView(APIView):
    # Ensure all requests are authenticated by Django first!
    permission_classes = [IsAuthenticated]

    def proxy_request(self, request, path=""):
        url = f"{FASTAPI_BASE_URL}/chat/{path}"
        
        # We forward the user's email and our internal key so FastAPI knows they are trusted
        headers = {
            "X-User-Email": request.user.email,
            "X-Internal-Auth": os.environ.get("INTERNAL_MICROSERVICE_KEY", "default-dev-key"),
        }
        
        # Forward Content-Type if present, except for multipart/form-data which requests handles automatically
        if 'CONTENT_TYPE' in request.META and not request.META['CONTENT_TYPE'].startswith('multipart/form-data'):
            headers["Content-Type"] = request.META["CONTENT_TYPE"]

        try:
            if request.method == "GET":
                response = requests.get(url, headers=headers, params=request.GET, stream=True)
            elif request.method == "POST":
                # Handle file uploads (multipart) vs JSON data
                if request.FILES:
                    files = {key: (file.name, file.read(), file.content_type) for key, file in request.FILES.items()}
                    response = requests.post(url, headers=headers, data=request.POST, files=files, stream=True)
                else:
                    response = requests.post(url, headers=headers, json=request.data, stream=True)
            elif request.method == "DELETE":
                response = requests.delete(url, headers=headers, stream=True)
            elif request.method == "PUT":
                response = requests.put(url, headers=headers, json=request.data, stream=True)
            else:
                return JsonResponse({"error": "Method not supported"}, status=405)

            # Act as a pure passage - proxy all headers except hop-by-hop
            excluded_headers = ['content-encoding', 'content-length', 'transfer-encoding', 'connection']
            proxy_headers = {k: v for k, v in response.headers.items() if k.lower() not in excluded_headers}

            from django.http import StreamingHttpResponse
            
            # Always stream the response, whether it's JSON or SSE
            django_response = StreamingHttpResponse(
                response.iter_content(chunk_size=128),
                status=response.status_code
            )
            
            # Apply original microservice headers (including content-type)
            for key, value in proxy_headers.items():
                django_response[key] = value
                
            return django_response
            
        except requests.exceptions.ConnectionError:
            return JsonResponse({"error": "AI Microservice is down or unreachable."}, status=503)

    def get(self, request, path=""):
        return self.proxy_request(request, path)

    def post(self, request, path=""):
        return self.proxy_request(request, path)

    def delete(self, request, path=""):
        return self.proxy_request(request, path)

    def put(self, request, path=""):
        return self.proxy_request(request, path)
