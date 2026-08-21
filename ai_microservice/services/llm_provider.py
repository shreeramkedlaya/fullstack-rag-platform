import logging
from langchain_google_genai import ChatGoogleGenerativeAI

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logging.getLogger("google.api_core.retry").setLevel(logging.DEBUG)
logging.getLogger("httpx").setLevel(logging.DEBUG)
logging.getLogger("urllib3").setLevel(logging.DEBUG)

logger = logging.getLogger(__name__)

GEMINI_API_KEY = "AIzaSyCSr9skk59mbVGKCKKaSvznxdW_C-zGgSU"

class LLMProvider:
    _instance = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def __init__(self):
        if LLMProvider._instance is not None:
            raise Exception("This class is a singleton!")
        else:
            self.llm = ChatGoogleGenerativeAI(
                model="gemini-3.5-flash-lite",
                api_key=GEMINI_API_KEY,
                temperature=0.3,
                max_retries=0,
                timeout=15
            )
            LLMProvider._instance = self
        
    def generate(self, full_prompt: str) -> str:
        response = self.llm.invoke(full_prompt)
        return response.content

    def generate_fast(self, prompt: str) -> str:
        # A lightweight/fast generation call for internal tasks like query rewriting
        fast_llm = ChatGoogleGenerativeAI(
            model="gemini-3.5-flash-lite",
            api_key=GEMINI_API_KEY,
            temperature=0.0, # Zero temp for deterministic rewrites
            max_retries=0,
            timeout=5
        )
        response = fast_llm.invoke(prompt)
        return response.content

    def stream(self, full_prompt: str):
        # Langchain provides a stream method for its models
        return self.llm.stream(full_prompt)
