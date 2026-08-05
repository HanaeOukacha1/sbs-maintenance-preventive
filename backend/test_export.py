from sqlalchemy import create_engine, text
from app.core.security import hash_password

engine = create_engine('mysql+pymysql://root:@localhost/sbs_db')
new_hash = hash_password('admin123')
with engine.connect() as conn:
    conn.execute(text("UPDATE users SET hashed_password = :h WHERE email = :e"), {'h': new_hash, 'e': 'admin@sbs.ma'})
    conn.commit()
    print('Password reset OK for admin@sbs.ma -> admin123')
