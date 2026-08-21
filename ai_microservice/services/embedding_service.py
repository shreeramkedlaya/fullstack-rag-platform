from langchain_huggingface import HuggingFaceEmbeddings

class EmbeddingService:
    _instance = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def __init__(self):
        if EmbeddingService._instance is not None:
            raise Exception("This class is a singleton!")
        else:
            print("\n[INIT] 🚀 LOADING 90MB PYTORCH EMBEDDING MODEL INTO RAM...\n")
            self.model = HuggingFaceEmbeddings(
                model_name="sentence-transformers/all-MiniLM-L6-v2"
            )
            EmbeddingService._instance = self
    
    def get_embedding(self, text: str):
        return self.model.embed_query(text)
