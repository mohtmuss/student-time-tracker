from tests.conftest import client, setup_student_mm26

def test_manual_clock_valid(client):
    setup_student_mm26()
    res = client.post('/manual-clock', json={
        'student_id': 'MM26',
        'clock_in': '09:00',
        'clock_out': '12:00'
    })
    assert res.status_code == 200
    assert res.get_json()['message'] == 'Entry added!'

def test_manual_clock_invalid_student(client):
    res = client.post('/manual-clock', json={
        'student_id': 'FAKE99',
        'clock_in': '09:00',
        'clock_out': '12:00'
    })
    assert res.status_code == 404

def test_manual_clock_missing_fields(client):
    setup_student_mm26()
    res = client.post('/manual-clock', json={
        'student_id': 'MM26',
        'clock_in': '09:00'
        # missing clock_out
    })
    assert res.status_code == 400

def test_manual_clock_shows_in_history(client):
    setup_student_mm26()
    client.post('/manual-clock', json={
        'student_id': 'MM26',
        'clock_in': '09:00',
        'clock_out': '12:00'
    })
    history = client.get('/student-history/MM26')
    data = history.get_json()
    assert len(data) > 0

def test_manual_clock_clock_out_before_clock_in(client):
    setup_student_mm26()
    res = client.post('/manual-clock', json={
        'student_id': 'MM26',
        'clock_in': '12:00',
        'clock_out': '09:00'
    })
    assert res.status_code == 200