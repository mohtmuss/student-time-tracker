from tests.conftest import client

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