import pytest
from main import app, db, Student, TimeLog
from datetime import datetime

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

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