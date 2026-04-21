from tests.conftest import client, setup_student_mm26

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
    res = client.get('/all-student-data')
    assert res.status_code == 200
    data = res.get_json()
    assert isinstance(data, list)
    assert 'name' in data[0]
    assert 'this_week_hours' in data[0]
    assert 'last_week_hours' in data[0]

def test_attendance_data(client):
    res = client.get('/attendance-data')
    assert res.status_code == 200
    data = res.get_json()
    assert 'day_data' in data
    assert len(data['day_data']) == 7