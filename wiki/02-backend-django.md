# 🔧 Backend — Django API Gateway

## Project Configuration (`tutorial/`)
- **`settings.py`**: Configures CORS (`localhost:5173`), credentials, and the 4 MySQL databases via `db_router.py`.
- **Global Auth:** `IsAdminForDelete` permission globally protects the application.

## CustomerOrders App
The most complete feature module with sub-packages, a service layer, and session-based auth.
- **Customer Sub-module**: Manages `Customer` model and `SystemUser` model (which handles our custom session-based auth).
- **Orders Sub-module**: Manages `Order` model linked to Customers.
- **Services**: Uses `CustomerService` and `OrderService` for business logic, including bulk upserts.

## NotesCRUD & Tasks Apps
Standard Django apps utilizing DRF.
- **NotesCRUD**: Stores notes in `notesapp_db`. Uses `NotesCRUDDirectAPIView`.
- **Tasks**: Stores tasks in `task_management_db`. Uses `TaskCRUDAPIView`.
