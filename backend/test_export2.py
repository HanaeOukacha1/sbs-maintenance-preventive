import urllib.request, json

data = json.dumps({'email': 'admin@sbs.ma', 'password': 'admin123'}).encode()
req = urllib.request.Request('http://localhost:8000/api/v1/auth/login', data=data, headers={'Content-Type': 'application/json'})
resp = urllib.request.urlopen(req)
result = json.loads(resp.read())
token = result['access_token']
print('Token OK')

req2 = urllib.request.Request('http://localhost:8000/api/v1/missions/', headers={'Authorization': 'Bearer ' + token})
resp2 = urllib.request.urlopen(req2)
missions = json.loads(resp2.read())
print('Missions:', len(missions))
mid = missions[0]['id']
print('Mission id:', mid)

req3 = urllib.request.Request('http://localhost:8000/api/v1/missions/' + str(mid) + '/export', headers={'Authorization': 'Bearer ' + token})
try:
    resp3 = urllib.request.urlopen(req3)
    content = resp3.read()
    print('Export OK, size:', len(content), 'bytes, Content-Type:', resp3.headers.get('Content-Type'))
except urllib.error.HTTPError as e:
    print('Export FAILED:', e.code, e.read().decode()[:500])
