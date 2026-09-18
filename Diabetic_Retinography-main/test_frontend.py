import requests

base = 'http://127.0.0.1:5000'

# Test 1: HTML index
r = requests.get(f'{base}/')
assert r.status_code == 200, f'Index returned {r.status_code}'
assert 'SEE THE RETINA' in r.text, 'Hero headline missing'
assert 'Retinal Screening Studio' in r.text, 'Screening studio missing'
print('[PASS] Index HTML contains updated clinical elements')

# Test 2: Assets
for p in ['/static/css/style.css', '/static/js/app.js', '/static/samples/sample_normal.jpg', '/static/samples/sample_dr.jpg']:
    res = requests.get(f'{base}{p}')
    assert res.status_code == 200, f'{p} returned {res.status_code}'
    print(f'[PASS] {p} -> {res.status_code} ({len(res.content)} bytes)')

# Test 3: Analyze Sample 1 (Normal)
with open('static/samples/sample_normal.jpg', 'rb') as f:
    res = requests.post(f'{base}/analyze', files={'image': f})
assert res.status_code == 200
data1 = res.json()
grade1 = data1['prediction']['grade']
conf1 = data1['prediction']['confidence'] * 100
print(f'[PASS] /analyze Normal Fundus -> Grade: {grade1} (Confidence: {conf1:.1f}%)')

# Test 4: Analyze Sample 2 (DR Signs)
with open('static/samples/sample_dr.jpg', 'rb') as f:
    res = requests.post(f'{base}/analyze', files={'image': f})
assert res.status_code == 200
data2 = res.json()
grade2 = data2['prediction']['grade']
conf2 = data2['prediction']['confidence'] * 100
print(f'[PASS] /analyze DR Fundus     -> Grade: {grade2} (Confidence: {conf2:.1f}%)')

print('\nALL CLINICAL FRONTEND & BACKEND INTEGRATION TESTS PASSED!')
