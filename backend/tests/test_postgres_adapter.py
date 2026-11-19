"""Unit test verifying the PostgreSQL cursor & connection wrapper translation logic."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from database import PostgresCursorWrapper, TABLE_PK_MAP


class MockRawCursor:
    def __init__(self):
        self.last_sql = None
        self.last_params = None
        self.rowcount = 1

    def execute(self, sql, params=None):
        self.last_sql = sql
        self.last_params = params

    def executemany(self, sql, params):
        self.last_sql = sql
        self.last_params = params

    def fetchone(self):
        return {"id": 101, "lab_id": 5}

    def fetchall(self):
        return [{"id": 101}, {"id": 102}]

    def close(self):
        pass


def test_wrapper_translation():
    mock_cur = MockRawCursor()
    wrapper = PostgresCursorWrapper(mock_cur, None)

    # 1. Test placeholder translation
    wrapper.execute("SELECT * FROM patients WHERE id = ? AND is_active = ?", (1, 1))
    assert "%s" in mock_cur.last_sql, "Question marks must be converted to %s"
    assert "?" not in mock_cur.last_sql, "No ? placeholders should remain"

    # 2. Test RETURNING clause injection for INSERT
    wrapper.execute("INSERT INTO patients (patient_name) VALUES (?)", ("John",))
    assert "RETURNING id" in mock_cur.last_sql, "INSERT into patients must automatically append RETURNING id"
    assert wrapper.lastrowid == 101, f"Expected lastrowid 101, got {wrapper.lastrowid}"

    # 3. Test custom PK injection
    wrapper.execute("INSERT INTO labs (lab_code, lab_name) VALUES (?, ?)", ("LAB99", "Test Lab"))
    assert "RETURNING lab_id" in mock_cur.last_sql, "INSERT into labs must append RETURNING lab_id"

    # 4. Test fetchall
    res = wrapper.fetchall()
    assert len(res) == 2 and res[0]["id"] == 101

    print("Postgres cursor adapter translation tests passed successfully!")


if __name__ == "__main__":
    test_wrapper_translation()
