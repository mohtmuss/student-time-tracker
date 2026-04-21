from tests.conftest import client, cleanup_student

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