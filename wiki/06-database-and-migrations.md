# 🗄️ Database & Migrations

## Multi-Database Architecture (MySQL)
The Django API uses 4 distinct databases routed automatically by `db_router.py`:
- `default` -> `djangodatabase` (Django admin, auth)
- `notesapp_db` -> `NotesCRUD` app
- `task_management_db` -> `Tasks` app
- `customer_orders_db` -> `CustomerOrders` app

## Migration Strategy
To handle multiple databases, do not run standard migrate commands without flags.
Use the parallel migration script:
```bash
python backend/run_parallel_migrations.py
```
Or apply manually:
```bash
python manage.py migrate --database=notesapp_db NotesCRUD
python manage.py migrate --database=task_management_db Tasks
```
