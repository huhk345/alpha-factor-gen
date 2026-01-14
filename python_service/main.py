from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import subprocess
import sys
import os
import tempfile
import json
import traceback

app = FastAPI()

class BacktestRequest(BaseModel):
    code: str
    data: dict

@app.post("/execute")
async def execute_backtest(request: BacktestRequest):
    temp_path = None
    try:
        # Create temp file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write(request.code)
            temp_path = f.name

        # Prepare input data
        input_json = json.dumps(request.data)

        # Run subprocess
        # We use the same python executable as the service
        process = subprocess.Popen(
            [sys.executable, temp_path],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        stdout, stderr = process.communicate(input=input_json)
        
        # Clean up
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)

        if process.returncode != 0:
            print(f"Error executing script. Stderr: {stderr}")
            return {"status": "error", "error": stderr, "stdout": stdout}
        
        try:
            # The script is expected to print JSON to stdout
            # There might be other print statements, so we should look for the JSON part?
            # Or assume the script only prints the JSON result.
            # The generated script usually prints only the result.
            result = json.loads(stdout)
            return {"status": "success", "result": result}
        except json.JSONDecodeError:
            print(f"JSON Decode Error. Stdout: {stdout}")
            return {"status": "error", "error": "Invalid JSON output from script", "stdout": stdout, "stderr": stderr}

    except Exception as e:
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)
        print(f"Server Error: {str(e)}")
        traceback.print_exc()
        return {"status": "error", "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5001)
