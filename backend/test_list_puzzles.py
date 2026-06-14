import urllib.request
import json

try:
    with urllib.request.urlopen("http://127.0.0.1:5000/api/puzzles") as response:
        res_body = response.read().decode("utf-8")
        data = json.loads(res_body)
        print("Puzzles found in API:")
        for p in data:
            print(f"- {p['id']}: {p['title']} ({p['difficulty']}) theme={p.get('theme')}")
except Exception as e:
    print("Error:", e)
