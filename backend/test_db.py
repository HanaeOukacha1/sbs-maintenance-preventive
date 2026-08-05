
from app.db.database import SessionLocal
from app.models.site import Site
db = SessionLocal()
site = db.query(Site).filter(Site.nom.like('%ANCFCC%')).first()
print('ANCFCC Site checklist_type:', site.checklist_type)

