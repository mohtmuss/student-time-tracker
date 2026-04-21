import requests
import random
from datetime import datetime, timedelta

BASE_URL = "http://localhost:5000"

first_names = ["James", "John", "Robert", "Michael", "William", "David", "Richard", "Joseph", "Thomas", "Charles",
               "Mary", "Patricia", "Jennifer", "Linda", "Barbara", "Elizabeth", "Susan", "Jessica", "Sarah", "Karen",
               "Daniel", "Matthew", "Anthony", "Mark", "Donald", "Steven", "Paul", "Andrew", "Joshua", "Kenneth",
               "Ashley", "Emily", "Amanda", "Melissa", "Stephanie", "Rebecca", "Sharon", "Laura", "Cynthia", "Dorothy",
               "Kevin", "Brian", "George", "Timothy", "Ronald", "Edward", "Jason", "Jeffrey", "Ryan", "Jacob",
               "Emma", "Olivia", "Sophia", "Isabella", "Mia", "Charlotte", "Amelia", "Harper", "Evelyn", "Abigail",
               "Nicholas", "Gary", "Eric", "Stephen", "Jonathan", "Larry", "Justin", "Scott", "Brandon", "Frank",
               "Madison", "Elizabeth", "Victoria", "Natalie", "Grace", "Chloe", "Zoey", "Lily", "Hannah", "Lillian",
               "Raymond", "Gregory", "Samuel", "Patrick", "Alexander", "Jack", "Dennis", "Jerry", "Tyler", "Aaron",
               "Samantha", "Christine", "Emma", "Katherine", "Debra", "Rachel", "Carolyn", "Janet", "Maria", "Heather"]

last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
              "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
              "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson",
              "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
              "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts"]

grad_years = [2025, 2026, 2027, 2028]

print("Adding 100 students...")
student_ids = []

for i in range(100):
    first = random.choice(first_names)
    last = random.choice(last_names)
    year = random.choice(grad_years)
    email = f"{first.lower()}.{last.lower()}{i}@millersville.edu"

    res = requests.post(f"{BASE_URL}/add-student", json={
        "first_name": first,
        "last_name": last,
        "email": email,
        "graduation_year": year
    })

    if res.status_code == 201:
        student_id = res.json()['student_id']
        student_ids.append(student_id)
        print(f"✅ Added {first} {last} → {student_id}")
    else:
        print(f"❌ Failed: {res.json()}")

print(f"\nAdding clock data for {len(student_ids)} students...")

now = datetime.now()

for student_id in student_ids:
    # add 3-7 days of clock data over past 4 weeks
    num_days = random.randint(3, 7)
    for _ in range(num_days):
        days_ago = random.randint(0, 28)
        clock_in_hour = random.randint(8, 14)
        duration = random.uniform(1, 4)  # 1 to 4 hours

        clock_in = now - timedelta(days=days_ago)
        clock_in = clock_in.replace(hour=clock_in_hour, minute=random.randint(0, 59), second=0)
        clock_out = clock_in + timedelta(hours=duration)

        # clock in
        r1 = requests.post(f"{BASE_URL}/clock-in", json={"student_id": student_id})
        if r1.status_code == 200:
            # clock out
            r2 = requests.post(f"{BASE_URL}/clock-out", json={"student_id": student_id})
            if r2.status_code == 200:
                print(f"✅ {student_id} clocked in/out")

print("\n🎉 Done! 100 students with clock data added!")