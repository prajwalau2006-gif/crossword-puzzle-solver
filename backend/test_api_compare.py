import urllib.request
import json

payload = {
    "grid": [
        ["#", "#", "", "#", "#"],
        ["B", "I", "T", "E", "S"],
        ["#", "#", "", "#", "#"],
        ["C", "A", "C", "H", "E"],
        ["#", "#", "", "#", "#"]
    ],
    "words": ["STACK", "BITES", "CACHE", "PRUNE", "NODES", "INNER"],
    "algorithm": "backtracking-fc-mrv",
    "diagonal": False
}

req = urllib.request.Request(
    "http://127.0.0.1:5000/api/compare",
    data=json.dumps(payload).encode("utf-8"),
    headers={"Content-Type": "application/json"}
)

try:
    with urllib.request.urlopen(req) as response:
        res_body = response.read().decode("utf-8")
        data = json.loads(res_body)
        print(json.dumps(data, indent=2))
except Exception as e:
    print("Error:", e)
