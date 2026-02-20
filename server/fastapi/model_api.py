from fastapi import FastAPI, Request
from pydantic import BaseModel
from generate_diagram import generate_diagram

app = FastAPI()

class RuleRequest(BaseModel):
    rules: str

@app.get("/")
async def index():
    return {"message": "Hello World"}

@app.post("/generate-diagram")
async def generate(req: RuleRequest):
    print("Generate diagram")
    result = generate_diagram(req.rules)
    return {"output": result}

# Run with: uvicorn model_api:app --port 8000