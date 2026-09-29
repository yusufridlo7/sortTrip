"""Refresh public Travelpayouts reference data. No API token is needed.
Source: https://travelpayouts.github.io/slate/ (Reference data).
"""
import json, pathlib, urllib.request
root=pathlib.Path(__file__).resolve().parents[1]
def read(kind):
    with urllib.request.urlopen('https://api.travelpayouts.com/data/en/'+kind+'.json',timeout=45) as r:
        return json.load(r)
cities={x['code']:x for x in read('cities') if x.get('code')}
locations={}
for x in list(cities.values())+read('airports'):
    code=x.get('code'); country=x.get('country_code'); city= cities.get(x.get('city_code',code),x)
    if code and country:
        locations[code]={'name':x.get('name') or code,'city':city.get('name') or code,'country':country,'zone':x.get('time_zone') or city.get('time_zone') or None,'cityCode':x.get('city_code') or code}
(root/'worker/locations.json').write_text(json.dumps(locations,ensure_ascii=False,separators=(',',':')))
print('Updated',len(locations),'location codes')
