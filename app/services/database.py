import os
import motor.motor_asyncio
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv(
    "MONGO_URI", 
    "mongodb://admin:mypassword@localhost:27017/netra_vision_db?authSource=admin"
)

client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI)
db = client.netra_vision_db

# We will use this collection to insert and retrieve diagnoses
history_collection = db.get_collection("analysis_history")