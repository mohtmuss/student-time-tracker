from flask import Flask, request, jsonify
from chat_config import get_system_prompt
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token
from flask_cors import CORS
from datetime import datetime, date, timedelta
from dotenv import load_dotenv
import anthropic
import json
import os
import pytz

load_dotenv()

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

CORS(app, resources={r"/*": {"origins": "*"}})

# ✅ Eastern timezone helpers
eastern = pytz.timezone('America/New_York')

def now_eastern():
    return datetime.now(eastern).replace(tzinfo=None)

def today_eastern():
    return datetime.now(eastern).date()

@app.after_request
def after_request(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS'
    return response

class Teacher(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)

class Student(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.String(10), unique=True, nullable=False)
    first_name = db.Column(db.String(50), nullable=False)
    middle_name = db.Column(db.String(50), nullable=True)
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

@app.route('/login', methods=['OPTIONS'])
def login_options():
    response = jsonify({'status': 'ok'})
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'POST,OPTIONS'
    return response, 200

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
    current_year = now_eastern().year
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
    if not data.get('first_name') or not data.get('last_name') or not data.get('email') or not data.get('graduation_year'):
        return jsonify({'error': 'All fields are required'}), 400

    first_name = data['first_name'].strip()
    last_name = data['last_name'].strip()
    middle_name = (data.get('middle_name') or '').strip() or None

    duplicate = Student.query.filter_by(
        first_name=first_name,
        last_name=last_name
    ).first()

    if duplicate and not middle_name:
        return jsonify({
            'error': 'duplicate',
            'message': f'A student named {first_name} {last_name} already exists. Please provide a middle name.'
        }), 409

    first = first_name[0].upper()
    last = last_name[0].upper()
    year = str(int(data['graduation_year']))[-2:]
    student_id = first + last + year
    existing = Student.query.filter_by(student_id=student_id).first()
    if existing:
        count = Student.query.filter(Student.student_id.like(student_id + '%')).count()
        student_id = student_id + str(count + 1)

    student = Student(
        student_id=student_id,
        first_name=first_name,
        middle_name=middle_name,
        last_name=last_name,
        email=data['email'],
        graduation_year=data['graduation_year'],
        status=get_status(int(data['graduation_year']))
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
        'middle_name': s.middle_name,
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
    existing_log = TimeLog.query.filter_by(student_id=student_id, clock_out=None).first()
    if existing_log:
        return jsonify({'error': 'Student already clocked in!'}), 400
    log = TimeLog(
        student_id=student_id,
        clock_in=now_eastern(),     # ✅ Eastern time
        date=today_eastern()        # ✅ Eastern date
    )
    db.session.add(log)
    db.session.commit()
    return jsonify({'message': 'Clocked in!'}), 200

@app.route('/clock-out', methods=['POST'])
def clock_out():
    data = request.get_json()
    student_id = data.get('student_id')
    log = TimeLog.query.filter_by(student_id=student_id, clock_out=None).first()
    if not log:
        return jsonify({'error': 'No active clock in found'}), 404
    log.clock_out = now_eastern()   # ✅ Eastern time
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
    return jsonify([log.student_id for log in logs])

@app.route('/all-student-data', methods=['GET'])
def all_student_data():
    students = Student.query.all()
    result = []
    now = now_eastern()                                         # ✅ Eastern time
    start_of_this_week = now - timedelta(days=now.weekday())
    start_of_this_week = start_of_this_week.replace(hour=0, minute=0, second=0)
    start_of_last_week = start_of_this_week - timedelta(days=7)
    end_of_last_week = start_of_this_week

    for s in students:
        logs = TimeLog.query.filter_by(student_id=s.student_id).all()
        this_week_hours = 0
        last_week_hours = 0
        for log in logs:
            if log.clock_in and log.clock_out:
                hours = (log.clock_out - log.clock_in).total_seconds() / 3600
                if log.clock_in >= start_of_this_week:
                    this_week_hours += hours
                elif log.clock_in >= start_of_last_week and log.clock_in < end_of_last_week:
                    last_week_hours += hours
        result.append({
            'name': f"{s.first_name} {s.middle_name[0].upper() + '. ' if s.middle_name else ''}{s.last_name}",
            'student_id': s.student_id,
            'status': s.status,
            'graduation_year': s.graduation_year,
            'this_week_hours': round(this_week_hours, 2),
            'last_week_hours': round(last_week_hours, 2),
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

    if not messages or not isinstance(messages, list) or len(messages) == 0:
        return jsonify({'error': 'messages are required'}), 400

    client = anthropic.Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))
    now = now_eastern()                                         # ✅ Eastern time

    response = client.messages.create(
        model='claude-opus-4-5',
        max_tokens=1000,
        system=get_system_prompt(students, now),
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
            log.clock_out = now_eastern()                       # ✅ Eastern time
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
            existing_log = TimeLog.query.filter_by(student_id=student_id, clock_out=None).first()
            if existing_log:
                return jsonify({'response': f"⚠️ **{student.first_name} {student.last_name}** is already clocked in!"})
            log = TimeLog(
                student_id=student_id,
                clock_in=now_eastern(),                         # ✅ Eastern time
                date=today_eastern()                            # ✅ Eastern date
            )
            db.session.add(log)
            db.session.commit()
            return jsonify({'response': f"🟢 Successfully clocked in **{student.first_name} {student.last_name}** ({student_id})!"})
        except Exception as e:
            return jsonify({'response': f"❌ Error clocking in: {str(e)}"})

    if 'TOGGLE_THEME' in response_text:
        return jsonify({'response': '🎨 Theme toggled!', 'action': 'TOGGLE_THEME'})

    return jsonify({'response': response_text})

@app.route('/attendance-data', methods=['GET'])
def attendance_data():
    from collections import defaultdict
    logs = TimeLog.query.all()
    day_hours = defaultdict(float)
    days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    for log in logs:
        if log.clock_in and log.clock_out:
            diff = (log.clock_out - log.clock_in).total_seconds() / 3600
            day_hours[days[log.clock_in.weekday()]] += diff
    return jsonify({'day_data': [{'day': day, 'hours': round(day_hours[day], 2)} for day in days]})

@app.route('/student-weekly-progress/<student_id>', methods=['GET'])
def student_weekly_progress(student_id):
    from collections import defaultdict
    logs = TimeLog.query.filter_by(student_id=student_id).all()
    weekly_hours = defaultdict(float)
    for log in logs:
        if log.clock_in and log.clock_out:
            diff = (log.clock_out - log.clock_in).total_seconds() / 3600
            week = log.clock_in.strftime('Week %U')
            weekly_hours[week] += diff
    sorted_weeks = sorted(weekly_hours.keys())
    return jsonify([{'week': week, 'hours': round(weekly_hours[week], 2)} for week in sorted_weeks])

@app.route('/erase-timelogs', methods=['POST'])
def erase_timelogs():
    data = request.get_json()
    if data.get('access_key') != 'mussa212634':
        return jsonify({'error': 'Invalid access key!'}), 403
    TimeLog.query.delete()
    db.session.commit()
    return jsonify({'message': 'All time logs erased successfully!'}), 200

@app.route('/manual-clock', methods=['POST'])
def manual_clock():
    data = request.get_json()
    student_id = data.get('student_id')
    clock_in_str = data.get('clock_in')
    clock_out_str = data.get('clock_out')
    date_str = today_eastern().strftime('%Y-%m-%d')             # ✅ Eastern date

    if not student_id or not clock_in_str or not clock_out_str:
        return jsonify({'error': 'All fields are required'}), 400

    student = Student.query.filter_by(student_id=student_id).first()
    if not student:
        return jsonify({'error': 'Student not found'}), 404

    clock_in = datetime.strptime(f"{date_str} {clock_in_str}", '%Y-%m-%d %H:%M')
    clock_out = datetime.strptime(f"{date_str} {clock_out_str}", '%Y-%m-%d %H:%M')

    log = TimeLog(
        student_id=student_id,
        clock_in=clock_in,
        clock_out=clock_out,
        date=clock_in.date()
    )
    db.session.add(log)
    db.session.commit()
    return jsonify({'message': 'Entry added!'}), 200

@app.route('/delete-student/<student_id>', methods=['DELETE'])
def delete_student(student_id):
    student = Student.query.filter_by(student_id=student_id).first()
    if not student:
        return jsonify({'error': 'Student not found'}), 404
    TimeLog.query.filter_by(student_id=student_id).delete()
    db.session.delete(student)
    db.session.commit()
    return jsonify({'message': 'Student deleted!'}), 200

@app.route('/delete-entry/<int:id>', methods=['DELETE'])
def delete_entry(id):
    log = TimeLog.query.get(id)
    if not log:
        return jsonify({'error': 'Entry not found'}), 404
    db.session.delete(log)
    db.session.commit()
    return jsonify({'message': 'Entry deleted!'}), 200

if __name__ == '__main__':
    app.run(debug=True)