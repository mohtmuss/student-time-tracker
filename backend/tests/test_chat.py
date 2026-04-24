# tests/test_chat.py
from tests.conftest import client
from unittest.mock import patch, MagicMock

def mock_anthropic_response(text):
    mock_content = MagicMock()
    mock_content.text = text
    mock_response = MagicMock()
    mock_response.content = [mock_content]
    return mock_response

# ---- Basic Chat Tests ----

def test_chat_basic_question(client):
    with patch('main.anthropic.Anthropic') as mock_client:
        mock_client.return_value.messages.create.return_value = mock_anthropic_response(
            "John Smith has 7.5 hours this week."
        )
        res = client.post('/chat', json={
            'messages': [{'role': 'user', 'content': 'How many hours does John have?'}],
            'students': '[]'
        })
        assert res.status_code == 200
        assert 'response' in res.get_json()

def test_chat_missing_messages(client):
    res = client.post('/chat', json={
        'students': '[]'
    })
    assert res.status_code == 400

def test_chat_empty_messages(client):
    res = client.post('/chat', json={
        'messages': [],
        'students': '[]'
    })
    assert res.status_code == 400

# ---- Action Tests (ADD_STUDENT, CLOCK_IN, CLOCK_OUT) ----

def test_chat_add_student_action(client):
    with patch('main.anthropic.Anthropic') as mock_client:
        mock_client.return_value.messages.create.return_value = mock_anthropic_response(
            'ADD_STUDENT:{"first_name": "Alice", "last_name": "Johnson", "email": "alice.j@millersville.edu", "graduation_year": 2027}'
        )
        res = client.post('/chat', json={
            'messages': [{'role': 'user', 'content': 'Add student Alice Johnson'}],
            'students': '[]'
        })
        assert res.status_code == 200
        assert 'Alice' in res.get_json()['response']
        # cleanup
        from tests.conftest import cleanup_student
        cleanup_student('alice.j@millersville.edu')

def test_chat_clock_in_action(client):
    from tests.conftest import setup_student_mm26, cleanup_clock
    setup_student_mm26()
    cleanup_clock('MM26')
    with patch('main.anthropic.Anthropic') as mock_client:
        mock_client.return_value.messages.create.return_value = mock_anthropic_response(
            'CLOCK_IN:{"student_id": "MM26"}'
        )
        res = client.post('/chat', json={
            'messages': [{'role': 'user', 'content': 'Clock in MM26'}],
            'students': '[]'
        })
        assert res.status_code == 200
        assert 'MM26' in res.get_json()['response']
        cleanup_clock('MM26')

def test_chat_clock_out_action(client):
    from tests.conftest import setup_student_mm26, cleanup_clock
    setup_student_mm26()
    cleanup_clock('MM26')
    # Clock in first
    client.post('/clock-in', json={'student_id': 'MM26'})
    with patch('main.anthropic.Anthropic') as mock_client:
        mock_client.return_value.messages.create.return_value = mock_anthropic_response(
            'CLOCK_OUT:{"student_id": "MM26"}'
        )
        res = client.post('/chat', json={
            'messages': [{'role': 'user', 'content': 'Clock out MM26'}],
            'students': '[]'
        })
        assert res.status_code == 200
        assert 'MM26' in res.get_json()['response']

def test_chat_clock_in_already_clocked_in(client):
    from tests.conftest import setup_student_mm26, cleanup_clock
    setup_student_mm26()
    cleanup_clock('MM26')
    client.post('/clock-in', json={'student_id': 'MM26'})
    with patch('main.anthropic.Anthropic') as mock_client:
        mock_client.return_value.messages.create.return_value = mock_anthropic_response(
            'CLOCK_IN:{"student_id": "MM26"}'
        )
        res = client.post('/chat', json={
            'messages': [{'role': 'user', 'content': 'Clock in MM26'}],
            'students': '[]'
        })
        assert res.status_code == 200
        assert 'already' in res.get_json()['response'].lower()
        cleanup_clock('MM26')

def test_chat_invalid_student_clock_in(client):
    with patch('main.anthropic.Anthropic') as mock_client:
        mock_client.return_value.messages.create.return_value = mock_anthropic_response(
            'CLOCK_IN:{"student_id": "FAKE99"}'
        )
        res = client.post('/chat', json={
            'messages': [{'role': 'user', 'content': 'Clock in FAKE99'}],
            'students': '[]'
        })
        assert res.status_code == 200
        assert '❌' in res.get_json()['response']