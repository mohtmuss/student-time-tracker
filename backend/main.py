from flask import Flask, request, jsonify
from flask_cors import CORS


app  = Flask(__name__)
CORS(app)
students = []


@app.route("/")
def home():
    return "Backend is working"


@app.route("/add-student", methods = ["POST"])
def add_student():
    data = request.get_json()
    
    print("Data Reseived", data)
    name = data["name"]
    email = data["email"]
    grad_year = data["grad_year"]
    
    ### generate code
    parts = name.split()
    code = (parts[0][0] + parts[-1][0] + str(grad_year)[-2:]).upper()
    
    student = {
        "name" : name,
        "email" : email,
        "grad_year": grad_year,
        "code" : code
    }
    students.append(student)
    return jsonify(student)

@app.route("/verify-code", methods = ["POST"])
def verify_code():
    data = request.get_jason()
    code = data["code"]
    
    for student in students:
        if student["code"] == code:
            return jsonify({"name": student["name"]
                            })
    return jsonify({"message": "Invalid code "}), 404
if __name__ == "__main__":
    app.run(debug=True)