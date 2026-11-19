# Modular LIMS backend (Flask + SQLite)

## Structure
- `app.py`: app factory, CORS, blueprint registration only.
- `database.py`: SQLite path, schema, connections, and initial table creation.
- `routes/`: HTTP endpoints grouped by feature.
- `services/`: validation, SQL operations, and response serialization by feature.
- `lims_local.db`: created beside `database.py` at runtime unless `LIMS_DB_PATH` is set.

## Install and run (Windows PowerShell)
```powershell
cd backend
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

Use the virtual-environment activation command that matches your shell. In Command Prompt use `.venv\Scripts\activate.bat`.

Health check: `http://127.0.0.1:5000/api/health`

## Database behavior
- Missing tables/indexes are created by `database.init_db()`.
- Active and Inactive statuses are seeded with `INSERT OR IGNORE`.
- No ORM and no SQLAlchemy. SQL statements use placeholders for values.
- No destructive migration or automatic alteration of existing tables is performed.
- This backend defaults to a new `lims_local.db` file; existing database files are not overwritten. Existing data is not automatically imported.

## API routes preserved
- `GET /api/health`
- `GET/POST /api/patients`
- `PUT/DELETE /api/patients/<id>`
- `GET /api/statuses`
- `GET/POST /api/tests`
- `PUT/DELETE /api/tests/<id>`
- `POST /api/registrations`
- `POST /api/orders`
- `GET /api/orders/<id>`
- `GET /api/diagnosis/orders`
- `PUT /api/order-subtests/<id>/result`
