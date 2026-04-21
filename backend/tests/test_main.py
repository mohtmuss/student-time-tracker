import pytest
from main import app, db, Student, TimeLog
from datetime import datetime

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def cleanup_student(email):
    with app.app_context():
        s = Student.query.filter_by(email=email).first()
        if s:
            db.session.delete(s)
            db.session.commit()

def cleanup_clock(student_id):
    with app.app_context():
        log = TimeLog.query.filter_by(student_id=student_id, clock_out=None).first()
        if log:
            log.clock_out = datetime.now()
            db.session.commit()

def setup_student_mm26():
    with app.app_context():
        existing = Student.query.filter_by(student_id='MM26').first()
        if not existing:
            student = Student(
                student_id='MM26',
                first_name='Mohamed',
                last_name='Mussa',
                email='mm26@millersville.edu',
                graduation_year=2026,
                status='alumni'
            )
            db.session.add(student)
            db.session.commit()

# ─── LOGIN ───────────────────────────────────────────────────────────

def test_login_success(client):
    res = client.post('/login', json={
        'email': 'kaitin.gibbs@millersville.edu',
        'password': 'yourpassword'
    })
    assert res.status_code == 200
    assert 'token' in res.get_json()

def test_login_wrong_password(client):
    res = client.post('/login', json={
        'email': 'kaitin.gibbs@millersville.edu',
        'password': 'Yourpassword'
    })
    assert res.status_code == 401

def test_login_right_email(client):
    res = client.post('/login', json={
        'email': 'kaitin.gibbs@millersville.edu',
        'password': 'yourpassword'
    })
    assert res.status_code == 200
    assert 'token' in res.get_json()

def test_login_wrong_email(client):
    res = client.post('/login', json={
        'email': 'Mohamed',
        'password': 'yourpassword'
    })
    assert res.status_code == 401

def test_login_missing_fields(client):
    res = client.post('/login', json={})
    assert res.status_code == 401

# ─── STUDENTS ────────────────────────────────────────────────────────

def test_get_students(client):
    res = client.get('/students')
    assert res.status_code == 200
    assert isinstance(res.get_json(), list)

def test_add_student(client):
    cleanup_student('test.user@millersville.edu')
    res = client.post('/add-student', json={
        'first_name': 'Test',
        'last_name': 'User',
        'email': 'test.user@millersville.edu',
        'graduation_year': 2026
    })
    assert res.status_code == 201
    assert 'student_id' in res.get_json()
    cleanup_student('test.user@millersville.edu')

def test_add_student_without_first_name(client):
    res = client.post('/add-student', json={
        'first_name': '',
        'last_name': 'User',
        'email': 'test.user@millersville.edu',
        'graduation_year': 2026
    })
    assert res.status_code == 400

def test_add_student_without_last_name(client):
    res = client.post('/add-student', json={
        'first_name': 'Test',
        'last_name': '',
        'email': 'test.user@millersville.edu',
        'graduation_year': 2026
    })
    assert res.status_code == 400

def test_add_student_without_email(client):
    res = client.post('/add-student', json={
        'first_name': 'Test',
        'last_name': 'User',
        'email': '',
        'graduation_year': 2026
    })
    assert res.status_code == 400

def test_add_student_without_graduation_year(client):
    res = client.post('/add-student', json={
        'first_name': 'Test',
        'last_name': 'User',
        'email': 'test.user@millersville.edu',
        'graduation_year': None
    })
    assert res.status_code == 400

def test_student_id_format(client):
    cleanup_student('anna.brown@millersville.edu')
    res = client.post('/add-student', json={
        'first_name': 'Anna',
        'last_name': 'Brown',
        'email': 'anna.brown@millersville.edu',
        'graduation_year': 2027
    })
    assert res.get_json()['student_id'] == 'AB27'
    cleanup_student('anna.brown@millersville.edu')

# ─── CLOCK IN ────────────────────────────────────────────────────────

def test_clock_in_valid_student(client):
    setup_student_mm26()
    cleanup_clock('MM26')
    res = client.post('/clock-in', json={'student_id': 'MM26'})
    assert res.status_code == 200
    assert res.get_json()['message'] == 'Clocked in!'
    cleanup_clock('MM26')

def test_clock_in_invalid_student(client):
    res = client.post('/clock-in', json={'student_id': 'FAKE99'})
    assert res.status_code == 404

def test_clock_in_already_clocked_in(client):
    setup_student_mm26()
    cleanup_clock('MM26')
    client.post('/clock-in', json={'student_id': 'MM26'})
    res = client.post('/clock-in', json={'student_id': 'MM26'})
    assert res.status_code == 400
    assert res.get_json()['error'] == 'Student already clocked in!'
    cleanup_clock('MM26')

# ─── CLOCK OUT ───────────────────────────────────────────────────────

def test_clock_out_valid_student(client):
    setup_student_mm26()
    cleanup_clock('MM26')
    client.post('/clock-in', json={'student_id': 'MM26'})
    res = client.post('/clock-out', json={'student_id': 'MM26'})
    assert res.status_code == 200
    assert res.get_json()['message'] == 'Clocked out!'

def test_clock_out_not_clocked_in(client):
    setup_student_mm26()
    cleanup_clock('MM26')
    res = client.post('/clock-out', json={'student_id': 'MM26'})
    assert res.status_code == 404

def test_clock_out_invalid_student(client):
    res = client.post('/clock-out', json={'student_id': 'FAKE99'})
    assert res.status_code == 404

# ─── STUDENT HISTORY ─────────────────────────────────────────────────

def test_student_history_valid(client):
    setup_student_mm26()
    res = client.get('/student-history/MM26')
    assert res.status_code == 200
    assert isinstance(res.get_json(), list)

def test_student_history_invalid(client):
    res = client.get('/student-history/FAKE99')
    assert res.status_code == 200
    assert res.get_json() == []

# ─── ALL STUDENT DATA ────────────────────────────────────────────────

def test_all_student_data(client):
    res = client.get('/all-student-data')
    assert res.status_code == 200
    data = res.get_json()
    assert isinstance(data, list)
    assert 'name' in data[0]
    assert 'this_week_hours' in data[0]
    assert 'last_week_hours' in data[0]

# ─── ATTENDANCE ──────────────────────────────────────────────────────

def test_attendance_data(client):
    res = client.get('/attendance-data')
    assert res.status_code == 200
    data = res.get_json()
    assert 'day_data' in data
    assert len(data['day_data']) == 7

# ─── SECURITY ────────────────────────────────────────────────────────

def test_erase_timelogs_wrong_key(client):
    res = client.post('/erase-timelogs', json={'access_key': 'wrongkey'})
    assert res.status_code == 403

def test_erase_timelogs_correct_key(client):
    res = client.post('/erase-timelogs', json={'access_key': 'mussa212634'})
    assert res.status_code == 200