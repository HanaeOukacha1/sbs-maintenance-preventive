
from app.db.database import SessionLocal
from app.models.mission import Mission
from app.models.user import User

db = SessionLocal()
mission = db.query(Mission).filter(Mission.id == 70).first()
if mission:
    user = db.query(User).filter(User.id == mission.technicien_id).first()
    print(f'Mission 70 Technicien: {user.email} (ID: {user.id})')
else:
    print('Mission 70 not found')

