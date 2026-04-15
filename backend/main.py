from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask import request, jsonify
from flask_jwt_extended import create_access_token

app = Flask(__name__)

# Database config
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://tracker_admin:mussa212634@localhost/student_tracker'
app.config['JWT_SECRET_KEY'] = 'supersecretkey'

# Initialize extensions
db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)
CORS(app)

# Database Models
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



if __name__ == '__main__':
    app.run(debug=True)