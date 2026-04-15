from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token
from flask_cors import CORS
from datetime import datetime, date
from dotenv import load_dotenv
import anthropic
import json
import os

load_dotenv()

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)
CORS(app)

class Teacher(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)

class Student(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.String(10), unique=True, nullable=False)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    graduation_year = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(20), nullable=False)

class TimeLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.String(10), nullable=False)
    clock_in = db.Column(db.DateTime, nullable=True)
    clock_out = db.Column(db.DateTime, nullable=True)
    date = db.Column(db.Date, nullable=False)

with app.app_context():
    db.create_all()

@app.route('/')
def home():
    return {'message': 'Student Time Tracker API is running!'}

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    teacher = Teacher.query.filter_by(email=email).first()
    if not teacher or not bcrypt.check_password_hash(teacher.password, password):
        return jsonify({'error': 'Invalid email or password'}), 401
    token = create_access_token(identity=email)
    return jsonify({'token': token}), 200

@app.route('/create-teacher', methods=['POST'])
def create_teacher():
    data = request.get_json()
    hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    teacher = Teacher(email=data['email'], password=hashed_password)
    db.session.add(teacher)
    db.session.commit()
    return jsonify({'message': 'Teacher created successfully!'}), 201

@app.route('/update-password', methods=['POST'])
def update_password():
    data = request.get_json()
    teacher = Teacher.query.filter_by(email=data['email']).first()
    if not teacher:
        return jsonify({'error': 'Teacher not found'}), 404
    teacher.password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    db.session.commit()
    return jsonify({'message': 'Password updated!'}), 200

def get_status(graduation_year):
    current_year = datetime.now().year
    diff = graduation_year - current_year
    if diff <= 0:
        return 'alumni'
    elif diff == 1:
        return 'senior'
    elif diff == 2:
        return 'junior'
    elif diff == 3:
        return 'sophomore'
    else:
        return 'freshman'

@app.route('/add-student', methods=['POST'])
def add_student():
    data = request.get_json()
    first = data['first_name'][0].upper()
    last = data['last_name'][0].upper()
    year = str(data['graduation_year'])[-2:]
    student_id = first + last + year
    existing = Student.query.filter_by(student_id=student_id).first()
    if existing:
        count = Student.query.filter(Student.student_id.like(student_id + '%')).count()
        student_id = student_id + str(count + 1)
    student = Student(
        student_id=student_id,
        first_name=data['first_name'],
        last_name=data['last_name'],
        email=data['email'],
        graduation_year=data['graduation_year'],
        status=get_status(data['graduation_year'])
    )
    db.session.add(student)
    db.session.commit()
    return jsonify({'message': 'Student added!', 'student_id': student_id}), 201

@app.route('/students', methods=['GET'])
def get_students():
    students = Student.query.all()
    return jsonify([{
        'id': s.id,
        'student_id': s.student_id,
        'first_name': s.first_name,
        'last_name': s.last_name,
        'email': s.email,
        'graduation_year': s.graduation_year,
        'status': s.status
    } for s in students])

@app.route('/clock-in', methods=['POST'])
def clock_in():
    data = request.get_json()
    student_id = data.get('student_id')
    student = Student.query.filter_by(student_id=student_id).first()
    if not student:
        return jsonify({'error': 'Student not found'}), 404
    log = TimeLog(
        student_id=student_id,
        clock_in=datetime.now(),
        date=date.today()
    )
    db.session.add(log)
    db.session.commit()
    return jsonify({'message': 'Clocked in!'}), 200

@app.route('/clock-out', methods=['POST'])
def clock_out():
    data = request.get_json()
    student_id = data.get('student_id')
    log = TimeLog.query.filter_by(
        student_id=student_id,
        clock_out=None
    ).first()
    if not log:
        return jsonify({'error': 'No active clock in found'}), 404
    log.clock_out = datetime.now()
    db.session.commit()
    return jsonify({'message': 'Clocked out!'}), 200

@app.route('/student-history/<student_id>', methods=['GET'])
def student_history(student_id):
    logs = TimeLog.query.filter_by(student_id=student_id).all()
    return jsonify([{
        'id': log.id,
        'clock_in': log.clock_in.strftime('%Y-%m-%d %H:%M:%S') if log.clock_in else None,
        'clock_out': log.clock_out.strftime('%Y-%m-%d %H:%M:%S') if log.clock_out else None,
        'date': log.date.strftime('%Y-%m-%d')
    } for log in logs])

@app.route('/clocked-in-students', methods=['GET'])
def clocked_in_students():
    logs = TimeLog.query.filter_by(clock_out=None).all()
    clocked_in_ids = [log.student_id for log in logs]
    return jsonify(clocked_in_ids)

@app.route('/all-student-data', methods=['GET'])
def all_student_data():
    students = Student.query.all()
    result = []
    for s in students:
        logs = TimeLog.query.filter_by(student_id=s.student_id).all()
        result.append({
            'name': s.first_name + ' ' + s.last_name,
            'student_id': s.student_id,
            'status': s.status,
            'graduation_year': s.graduation_year,
            'history': [{
                'date': log.date.strftime('%Y-%m-%d'),
                'clock_in': log.clock_in.strftime('%H:%M') if log.clock_in else None,
                'clock_out': log.clock_out.strftime('%H:%M') if log.clock_out else None,
            } for log in logs]
        })
    return jsonify(result)

@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json()
    messages = data.get('messages')
    students = data.get('students')

    client = anthropic.Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))

    response = client.messages.create(
        model='claude-opus-4-5',
        max_tokens=1000,
        system=f"""You are a helpful assistant for a student time tracking system.
Here is the current student data:
{students}

IMPORTANT: You have FOUR jobs:
1. Answer questions about existing students
2. ADD new students - respond with ONLY:
ADD_STUDENT:{{"first_name": "John", "last_name": "Smith", "email": "john@school.com", "graduation_year": 2026}}
3. CLOCK OUT a student - respond with ONLY:
CLOCK_OUT:{{"student_id": "MM26"}}
4. CLOCK IN a student - respond with ONLY:
CLOCK_IN:{{"student_id": "MM26"}}

You ARE able to add students, clock in and clock out.
For all other questions answer normally.""",
        messages=messages
    )

    response_text = response.content[0].text

    if 'ADD_STUDENT:' in response_text:
        try:
            json_str = response_text.split('ADD_STUDENT:')[1].strip()
            student_data = json.loads(json_str)
            first = student_data['first_name'][0].upper()
            last = student_data['last_name'][0].upper()
            year = str(student_data['graduation_year'])[-2:]
            student_id = first + last + year
            existing = Student.query.filter_by(student_id=student_id).first()
            if existing:
                count = Student.query.filter(Student.student_id.like(student_id + '%')).count()
                student_id = student_id + str(count + 1)
            status = get_status(student_data['graduation_year'])
            student = Student(
                student_id=student_id,
                first_name=student_data['first_name'],
                last_name=student_data['last_name'],
                email=student_data['email'],
                graduation_year=student_data['graduation_year'],
                status=status
            )
            db.session.add(student)
            db.session.commit()
            return jsonify({'response': f"✅ Student added!\n\n**Name:** {student_data['first_name']} {student_data['last_name']}\n**ID:** {student_id}\n**Status:** {status}"})
        except Exception as e:
            return jsonify({'response': f"❌ Error adding student: {str(e)}"})

    if 'CLOCK_OUT:' in response_text:
        try:
            json_str = response_text.split('CLOCK_OUT:')[1].strip()
            clock_data = json.loads(json_str)
            student_id = clock_data['student_id']
            log = TimeLog.query.filter_by(student_id=student_id, clock_out=None).first()
            if not log:
                return jsonify({'response': f"❌ {student_id} is not currently clocked in!"})
            log.clock_out = datetime.now()
            db.session.commit()
            return jsonify({'response': f"🔴 Successfully clocked out **{student_id}**!"})
        except Exception as e:
            return jsonify({'response': f"❌ Error clocking out: {str(e)}"})

    if 'CLOCK_IN:' in response_text:
        try:
            json_str = response_text.split('CLOCK_IN:')[1].strip()
            clock_data = json.loads(json_str)
            student_id = clock_data['student_id']
            student = Student.query.filter_by(student_id=student_id).first()
            if not student:
                return jsonify({'response': f"❌ Student {student_id} not found!"})
            log = TimeLog(
                student_id=student_id,
                clock_in=datetime.now(),
                date=date.today()
            )
            db.session.add(log)
            db.session.commit()
            return jsonify({'response': f"🟢 Successfully clocked in **{student_id}**!"})
        except Exception as e:
            return jsonify({'response': f"❌ Error clocking in: {str(e)}"})

    return jsonify({'response': response_text})

if __name__ == '__main__':
    app.run(debug=True)