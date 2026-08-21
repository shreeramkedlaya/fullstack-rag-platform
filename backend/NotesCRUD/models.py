from django.db import models


class Note(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Ensure NotesCRUD app data is routed into notesapp_db (not default djangodatabase)
    db_using = "notesapp_db"

    class Meta:
        db_table = "notes_table"
        ordering = ["-created_at"]

    def __str__(self):
        return self.title
