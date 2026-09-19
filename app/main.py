from fastapi import FastAPI
from dotenv import load_dotenv
# from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware


load_dotenv()
from routes.analyse import router as analyse_router
from routes.delete import router as delete_router

app =FastAPI(
    title="Netra Vision API",
    description="API Endpoints for a Crop Managements",
    version="1.0.0"   
)


app.include_router(analyse_router)
app.include_router(delete_router)

@app.get("/")
async def root():
    return {
        "app" :"Netra Vision",
        "version":"1.0.0",
        "endpoints":{
            "POST/analyse": "Upload an image for Diesease Detection",
            "POST/analyse/batch": "Upload multiple images for batch disease detection",
            "GET/analyses":"Retreive a list of all analyses performed",
            "GET/analyses{analyses.id}": "Retrieve details of specific analyses by ID"
        }
    }



# app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Specific frontend can be restricted
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)