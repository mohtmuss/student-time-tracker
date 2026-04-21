from tests.conftest import client, setup_student_mm26, cleanup_clock

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