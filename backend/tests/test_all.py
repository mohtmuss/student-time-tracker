# tests/test_all.py
from tests.conftest import client, cleanup_student, cleanup_clock, setup_student_mm26
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta
from main import app, db, Student, TimeLog
import json

# =====================
#   HELPER FUNCTIONS
# =====================

def add_time_log(student_id, hours_ago_start, duration_hours):
    with app.app_context():
        clock_in = datetime.now() - timedelta(hours=hours_ago_start)
        clock_out = clock_in + timedelta(hours=duration_hours)
        log = TimeLog(
            student_id=student_id,
            clock_in=clock_in,
            clock_out=clock_out,
            date=clock_in.date()
        )
        db.session.add(log)
        db.session.commit()

def cleanup_logs(student_id):
    with app.app_context():
        TimeLog.query.filter_by(student_id=student_id).delete()
        db.session.commit()

# =====================
#   STUDENT TESTS
# =====================

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

def test_delete_student(client):
    cleanup_student('jane@millersville.edu')
    client.post('/add-student', json={
        'first_name': 'Jane',
        'last_name': 'Doe',
        'email': 'jane@millersville.edu',
        'graduation_year': 2027
    })
    res = client.delete('/delete-student/JD27')
    assert res.status_code == 200
    cleanup_student('jane@millersville.edu')

def test_delete_nonexistent_student(client):
    res = client.delete('/delete-student/FAKE99')
    assert res.status_code == 404

# =====================
#   DUPLICATE NAME
# =====================

def test_duplicate_name_returns_409(client):
    cleanup_student('dup1@millersville.edu')
    cleanup_student('dup2@millersville.edu')

    # Add first student
    client.post('/add-student', json={
        'first_name': 'John',
        'last_name': 'Smith',
        'email': 'dup1@millersville.edu',
        'graduation_year': 2026
    })

    # Add second student with same name — should return 409
    res = client.post('/add-student', json={
        'first_name': 'John',
        'last_name': 'Smith',
        'email': 'dup2@millersville.edu',
        'graduation_year': 2027
    })
    assert res.status_code == 409
    assert 'message' in res.get_json()

    cleanup_student('dup1@millersville.edu')
    cleanup_student('dup2@millersville.edu')

def test_duplicate_name_with_middle_name_succeeds(client):
    cleanup_student('dup1@millersville.edu')
    cleanup_student('dup2@millersville.edu')

    # Add first student
    client.post('/add-student', json={
        'first_name': 'John',
        'last_name': 'Smith',
        'email': 'dup1@millersville.edu',
        'graduation_year': 2026
    })

    # Add second student with middle name — should succeed
    res = client.post('/add-student', json={
        'first_name': 'John',
        'last_name': 'Smith',
        'middle_name': 'Michael',
        'email': 'dup2@millersville.edu',
        'graduation_year': 2027
    })
    assert res.status_code == 201

    cleanup_student('dup1@millersville.edu')
    cleanup_student('dup2@millersville.edu')

def test_middle_name_stored_correctly(client):
    cleanup_student('middle.test@millersville.edu')
    cleanup_student('middle.test2@millersville.edu')

    # Add base student
    client.post('/add-student', json={
        'first_name': 'Sarah',
        'last_name': 'Jones',
        'email': 'middle.test@millersville.edu',
        'graduation_year': 2026
    })

    # Add with middle name
    client.post('/add-student', json={
        'first_name': 'Sarah',
        'last_name': 'Jones',
        'middle_name': 'Elizabeth',
        'email': 'middle.test2@millersville.edu',
        'graduation_year': 2026
    })

    res = client.get('/students')
    students = res.get_json()
    sarah_e = next((s for s in students if s.get('middle_name') == 'Elizabeth'), None)
    assert sarah_e is not None
    assert sarah_e['middle_name'] == 'Elizabeth'

    cleanup_student('middle.test@millersville.edu')
    cleanup_student('middle.test2@millersville.edu')

# =====================
#   STATUS TESTS
# =====================

def test_status_auto_calculated_freshman(client):
    cleanup_student('fresh@millersville.edu')
    current_year = datetime.now().year
    res = client.post('/add-student', json={
        'first_name': 'Fresh',
        'last_name': 'Man',
        'email': 'fresh@millersville.edu',
        'graduation_year': current_year + 4
    })
    assert res.status_code == 201
    res = client.get('/students')
    student = next((s for s in res.get_json() if s['email'] == 'fresh@millersville.edu'), None)
    assert student['status'] == 'freshman'
    cleanup_student('fresh@millersville.edu')

def test_status_auto_calculated_alumni(client):
    cleanup_student('alum@millersville.edu')
    res = client.post('/add-student', json={
        'first_name': 'Alum',
        'last_name': 'Ni',
        'email': 'alum@millersville.edu',
        'graduation_year': 2020
    })
    assert res.status_code == 201
    res = client.get('/students')
    student = next((s for s in res.get_json() if s['email'] == 'alum@millersville.edu'), None)
    assert student['status'] == 'alumni'
    cleanup_student('alum@millersville.edu')

# =====================
#   CLOCK IN/OUT
# =====================

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

def test_clocked_in_students_list(client):
    setup_student_mm26()
    cleanup_clock('MM26')
    client.post('/clock-in', json={'student_id': 'MM26'})
    res = client.get('/clocked-in-students')
    assert res.status_code == 200
    assert 'MM26' in res.get_json()
    cleanup_clock('MM26')

# =====================
#   MANUAL CLOCK
# =====================

def test_manual_clock_valid(client):
    setup_student_mm26()
    cleanup_logs('MM26')
    res = client.post('/manual-clock', json={
        'student_id': 'MM26',
        'clock_in': '09:00',
        'clock_out': '11:00'
    })
    assert res.status_code == 200
    cleanup_logs('MM26')

def test_manual_clock_invalid_student(client):
    res = client.post('/manual-clock', json={
        'student_id': 'FAKE99',
        'clock_in': '09:00',
        'clock_out': '11:00'
    })
    assert res.status_code == 404

def test_manual_clock_missing_fields(client):
    res = client.post('/manual-clock', json={
        'student_id': 'MM26'
    })
    assert res.status_code == 400

def test_manual_clock_shows_in_history(client):
    setup_student_mm26()
    cleanup_logs('MM26')
    client.post('/manual-clock', json={
        'student_id': 'MM26',
        'clock_in': '09:00',
        'clock_out': '12:00'
    })
    res = client.get('/student-history/MM26')
    logs = res.get_json()
    assert len(logs) == 1
    cleanup_logs('MM26')

# =====================
#   WEEKLY HOURS
# =====================

def test_weekly_hours_correct(client):
    setup_student_mm26()
    cleanup_logs('MM26')

    add_time_log('MM26', hours_ago_start=5, duration_hours=3)
    add_time_log('MM26', hours_ago_start=2, duration_hours=4)

    res = client.get('/all-student-data')
    data = res.get_json()
    mm26 = next((s for s in data if s['student_id'] == 'MM26'), None)
    assert mm26 is not None
    assert mm26['this_week_hours'] == 7.0
    cleanup_logs('MM26')

def test_weekly_hours_zero_when_no_logs(client):
    setup_student_mm26()
    cleanup_logs('MM26')
    res = client.get('/all-student-data')
    data = res.get_json()
    mm26 = next((s for s in data if s['student_id'] == 'MM26'), None)
    assert mm26['this_week_hours'] == 0.0
    cleanup_logs('MM26')

def test_last_week_hours_not_counted_as_this_week(client):
    setup_student_mm26()
    cleanup_logs('MM26')
    add_time_log('MM26', hours_ago_start=8 * 24, duration_hours=5)
    res = client.get('/all-student-data')
    data = res.get_json()
    mm26 = next((s for s in data if s['student_id'] == 'MM26'), None)
    assert mm26['this_week_hours'] == 0.0
    assert mm26['last_week_hours'] == 5.0
    cleanup_logs('MM26')

# =====================
#   DELETE ENTRY
# =====================

def test_delete_entry(client):
    setup_student_mm26()
    cleanup_logs('MM26')
    client.post('/manual-clock', json={
        'student_id': 'MM26',
        'clock_in': '09:00',
        'clock_out': '11:00'
    })
    res = client.get('/student-history/MM26')
    logs = res.get_json()
    log_id = logs[0]['id']
    res = client.delete(f'/delete-entry/{log_id}')
    assert res.status_code == 200
    cleanup_logs('MM26')

def test_delete_nonexistent_entry(client):
    res = client.delete('/delete-entry/999999')
    assert res.status_code == 404

# =====================
#   HISTORY
# =====================

def test_student_history_valid(client):
    setup_student_mm26()
    res = client.get('/student-history/MM26')
    assert res.status_code == 200
    assert isinstance(res.get_json(), list)

def test_student_history_invalid(client):
    res = client.get('/student-history/FAKE99')
    assert res.status_code == 200
    assert res.get_json() == []

def test_all_student_data(client):
    setup_student_mm26()
    res = client.get('/all-student-data')
    assert res.status_code == 200
    data = res.get_json()
    assert isinstance(data, list)
    mm26 = next((s for s in data if s['student_id'] == 'MM26'), None)
    assert mm26 is not None
    assert 'this_week_hours' in mm26
    assert 'last_week_hours' in mm26

def test_attendance_data(client):
    res = client.get('/attendance-data')
    assert res.status_code == 200
    assert 'day_data' in res.get_json()

# =====================
#   LOGIN
# =====================

def test_login_success(client):
    res = client.post('/login', json={
        'email': 'Kaitlin.Gibbs@millersville.edu',
        'password': 'camp-scholars'
    })
    assert res.status_code == 200
    assert 'token' in res.get_json()

def test_login_wrong_password(client):
    res = client.post('/login', json={
        'email': 'Kaitlin.Gibbs@millersville.edu',
        'password': 'wrongpassword'
    })
    assert res.status_code == 401

def test_login_right_email(client):
    res = client.post('/login', json={
        'email': 'Kaitlin.Gibbs@millersville.edu',
        'password': 'camp-scholars'
    })
    assert res.status_code == 200
    assert 'token' in res.get_json()

def test_login_wrong_email(client):
    res = client.post('/login', json={
        'email': 'wrong@email.com',
        'password': 'camp-scholars'
    })
    assert res.status_code == 401

def test_login_missing_fields(client):
    res = client.post('/login', json={})
    assert res.status_code == 401

def test_login_second_teacher(client):
    res = client.post('/login', json={
        'email': 'Apsara.Uprety@millersville.edu',
        'password': 'camp-scholars'
    })
    assert res.status_code == 200
    assert 'token' in res.get_json()

# =====================
#   CHAT
# =====================

def test_chat_missing_messages(client):
    res = client.post('/chat', json={'students': '[]'})
    assert res.status_code == 400

def test_chat_empty_messages(client):
    res = client.post('/chat', json={'messages': [], 'students': '[]'})
    assert res.status_code == 400

def test_chat_basic_response(client):
    mock_response = MagicMock()
    mock_response.content = [MagicMock(text='There is 1 student this week.')]
    with patch('main.anthropic.Anthropic') as mock_anthropic:
        mock_anthropic.return_value.messages.create.return_value = mock_response
        res = client.post('/chat', json={
            'messages': [{'role': 'user', 'content': 'How many students?'}],
            'students': '[]'
        })
    assert res.status_code == 200
    assert 'response' in res.get_json()

def test_chat_add_student_action(client):
    cleanup_student('chatbot.test@millersville.edu')
    mock_response = MagicMock()
    mock_response.content = [MagicMock(text='ADD_STUDENT:{"first_name": "Chat", "last_name": "Bot", "email": "chatbot.test@millersville.edu", "graduation_year": 2026}')]
    with patch('main.anthropic.Anthropic') as mock_anthropic:
        mock_anthropic.return_value.messages.create.return_value = mock_response
        res = client.post('/chat', json={
            'messages': [{'role': 'user', 'content': 'Add Chat Bot'}],
            'students': '[]'
        })
    assert res.status_code == 200
    assert '✅' in res.get_json()['response']
    cleanup_student('chatbot.test@millersville.edu')

def test_chat_clock_in_action(client):
    setup_student_mm26()
    cleanup_clock('MM26')
    mock_response = MagicMock()
    mock_response.content = [MagicMock(text='CLOCK_IN:{"student_id": "MM26"}')]
    with patch('main.anthropic.Anthropic') as mock_anthropic:
        mock_anthropic.return_value.messages.create.return_value = mock_response
        res = client.post('/chat', json={
            'messages': [{'role': 'user', 'content': 'Clock in MM26'}],
            'students': '[]'
        })
    assert res.status_code == 200
    assert '🟢' in res.get_json()['response']
    cleanup_clock('MM26')

def test_chat_clock_out_action(client):
    setup_student_mm26()
    client.post('/clock-in', json={'student_id': 'MM26'})
    mock_response = MagicMock()
    mock_response.content = [MagicMock(text='CLOCK_OUT:{"student_id": "MM26"}')]
    with patch('main.anthropic.Anthropic') as mock_anthropic:
        mock_anthropic.return_value.messages.create.return_value = mock_response
        res = client.post('/chat', json={
            'messages': [{'role': 'user', 'content': 'Clock out MM26'}],
            'students': '[]'
        })
    assert res.status_code == 200
    assert '🔴' in res.get_json()['response']

def test_chat_toggle_theme_action(client):
    mock_response = MagicMock()
    mock_response.content = [MagicMock(text='TOGGLE_THEME')]
    with patch('main.anthropic.Anthropic') as mock_anthropic:
        mock_anthropic.return_value.messages.create.return_value = mock_response
        res = client.post('/chat', json={
            'messages': [{'role': 'user', 'content': 'Toggle theme'}],
            'students': '[]'
        })
    assert res.status_code == 200
    data = res.get_json()
    assert data['action'] == 'TOGGLE_THEME'
    assert '🎨' in data['response']

def test_chat_invalid_student_clock_in(client):
    mock_response = MagicMock()
    mock_response.content = [MagicMock(text='CLOCK_IN:{"student_id": "FAKE99"}')]
    with patch('main.anthropic.Anthropic') as mock_anthropic:
        mock_anthropic.return_value.messages.create.return_value = mock_response
        res = client.post('/chat', json={
            'messages': [{'role': 'user', 'content': 'Clock in FAKE99'}],
            'students': '[]'
        })
    assert res.status_code == 200
    assert '❌' in res.get_json()['response']