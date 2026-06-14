import json

transcript_path = r"C:\Users\Prajwal\.gemini\antigravity-ide\brain\c973cb46-46d4-4777-85d2-ac7a1e2c25a1\.system_generated\logs\transcript.jsonl"

try:
    with open(transcript_path, "r", encoding="utf-8") as f:
        for i, line in enumerate(f):
            step = json.loads(line)
            content = step.get("content", "")
            # Check if this step is from the browser subagent's run
            if "browser" in str(step) or "DOM" in str(step):
                # Print steps related to browser tool calls
                print(f"Step {step.get('step_index')}: type={step.get('type')}, status={step.get('status')}")
                if "console" in str(step) or "log" in str(step) or "error" in str(step):
                    print("Matches console/log/error!")
                    print(content[:500])
                    print("=" * 60)
except Exception as e:
    print("Error:", e)
