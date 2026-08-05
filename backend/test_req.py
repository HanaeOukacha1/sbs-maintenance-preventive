import httpx
try:
    r = httpx.get('http://localhost:8000/api/v1/missions/70/export')
    print(r.status_code, r.text)
except Exception as e:
    print('Error:', e)
