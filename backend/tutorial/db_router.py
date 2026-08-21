from django.apps import apps
import logging

logger = logging.getLogger(__name__)


class DynamicMetaRouter:
    default_db = "default"
    app_db_map = {
        "notescrud": "notesapp_db",
        "tasks": "task_management_db",
        "customerorders": "customer_orders_db",
        # SystemUser lives in customer_orders_db; authentication/ is its new Python home
        "authentication": "customer_orders_db",
    }

    # 🔥 READ
    def db_for_read(self, model, **hints):
        db = getattr(model, "db_using", None)
        return db or self.default_db

    # 🔥 WRITE
    def db_for_write(self, model, **hints):
        db = getattr(model, "db_using", None)
        return db or self.default_db

    # 🔥 RELATIONS (allow only same DB)
    def allow_relation(self, obj1, obj2, **hints):
        db1 = getattr(obj1.__class__, "db_using", self.default_db)
        db2 = getattr(obj2.__class__, "db_using", self.default_db)
        return db1 == db2

    # 🔥 MIGRATIONS (IMPORTANT FIXES HERE)
    def allow_migrate(self, db, app_label, model_name=None, **hints):

        # Core Django apps → always default DB
        core_apps = {
            "auth",
            "contenttypes",
            "admin",
            "sessions",
            "sites",
            "messages",
            "staticfiles",
            "token_blacklist",
        }

        if app_label in core_apps:
            return db == self.default_db

        # If the app is explicitly mapped to a DB, use that mapping.
        mapped = self.app_db_map.get(app_label.lower() if app_label else app_label)
        if mapped:
            return db == mapped

        # If model is provided, prefer model-level `db_using` attribute.
        if model_name is not None:
            try:
                model = apps.get_model(app_label, model_name)

                if model is not None:
                    model_db = getattr(model, "db_using", None)
                    if model_db:
                        return db == model_db

            except LookupError:
                logger.warning(f"[Router] Model lookup failed: {app_label}.{model_name}")
            except Exception as e:
                logger.warning(
                    f"[Router] Migration check failed for {app_label}.{model_name}: {e}"
                )

        # Default: Prevent any unmapped apps from migrating to prevent accidental pollution of default DB.
        return False
