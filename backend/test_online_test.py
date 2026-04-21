import requests
import os

BASE_URL = os.getenv("BASE_URL", "http://localhost:5000")

# use a real student_id from your database
STUDENT_ID = "MM26"  # change this to a real one

def test_server_alive():
    res = requests.get(f"{BASE_URL}/")
    assert res.status_code == 200
    assert res.json()["message"] == "Student Time Tracker API is running!"

def test_get_students():
    res = requests.get(f"{BASE_URL}/students")
    assert res.status_code == 200
    assert isinstance(res.json(), list)

def test_clock_in():
    res = requests.post(f"{BASE_URL}/clock-in", json={"student_id": STUDENT_ID})
    data = res.json()
    # either clocked in or already clocked in
    assert res.status_code in [200, 400]
    print("Clock in:", data)

def test_clock_out():
    res = requests.post(f"{BASE_URL}/clock-out", json={"student_id": STUDENT_ID})
    data = res.json()
    # either clocked out or no active session
    assert res.status_code in [200, 404]
    print("Clock out:", data)

def test_full_clock_cycle():
    # make sure clocked out first
    requests.post(f"{BASE_URL}/clock-out", json={"student_id": STUDENT_ID})

    # clock in
    res1 = requests.post(f"{BASE_URL}/clock-in", json={"student_id": STUDENT_ID})
    assert res1.status_code == 200
    assert res1.json()["message"] == "Clocked in!"

    # should not be able to clock in again
    res2 = requests.post(f"{BASE_URL}/clock-in", json={"student_id": STUDENT_ID})
    assert res2.status_code == 400
    assert "already clocked in" in res2.json()["error"]

    # clock out
    res3 = requests.post(f"{BASE_URL}/clock-out", json={"student_id": STUDENT_ID})
    assert res3.status_code == 200
    assert res3.json()["message"] == "Clocked out!"

    # should not be able to clock out again
    res4 = requests.post(f"{BASE_URL}/clock-out", json={"student_id": STUDENT_ID})
    assert res4.status_code == 404

def test_student_history():
    res = requests.get(f"{BASE_URL}/student-history/{STUDENT_ID}")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    if len(data) > 0:
        assert "clock_in" in data[0]
        assert "clock_out" in data[0]
        assert "date" in data[0]

def test_clocked_in_students():
    res = requests.get(f"{BASE_URL}/clocked-in-students")
    assert res.status_code == 200
    assert isinstance(res.json(), list)