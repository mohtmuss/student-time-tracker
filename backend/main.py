from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from flask_cors import CORS

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

if __name__ == '__main__':
    app.run(debug=True)