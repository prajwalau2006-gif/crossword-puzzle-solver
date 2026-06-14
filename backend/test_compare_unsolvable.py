import urllib.request
import json

# Let's fetch the unsolvable-demo puzzle from the API first
try:
    with urllib.request.urlopen("http://127.0.0.1:5000/api/puzzles") as response:
        res_body = response.read().decode("utf-8")
        puzzles = json.loads(res_body)
        unsolvable = next(p for p in puzzles if p["id"] == "unsolvable-demo")
except Exception as e:
    print("Failed to fetch puzzles:", e)
    sys.exit(1)

payload = {
    "grid": unsolvable["grid"],
    "words": unsolvable["words"],
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
