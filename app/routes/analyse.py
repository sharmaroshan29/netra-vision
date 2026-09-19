from fastapi import APIRouter, UploadFile, File, HTTPException
from services.image import validate_image, resize_image_if_needed, save_image
from services.vision import analyse_image as vision_analyse_image
from services.database import history_collection
from datetime import datetime, timezone
from bson.errors import InvalidId
from bson import ObjectId
from typing import List
import asyncio
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv
import uuid
import os




router =APIRouter(
    prefix="/analyse",
    tags=["Analyse"]
)

load_dotenv()
cloudinary.config( 
    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME"), 
    api_key = os.getenv("CLOUDINARY_API_KEY"), 
    api_secret = os.getenv("CLOUDINARY_API_SECRET"),
    secure = True
)


async def process_single_image(file: UploadFile):
    """Process a single image for disease detection"""
    content = await file.read()

    validation = validate_image(content, file.content_type)
    if not validation["is_valid"]:
        raise HTTPException(status_code=400, detail=validation["message"])

    processed = resize_image_if_needed(content)

    # 1. Upload the in-memory processed bytes directly to Cloudinary
    upload_res = cloudinary.uploader.upload(
        processed,
        folder="netra_vision_scans",
        resource_type="image"
    )
    secure_url = upload_res.get("secure_url")

    # 2. Run your Gemini vision analysis
    result = await vision_analyse_image(processed, file.content_type)

    # 3. Store the cloud URL in the database
    db_record = {
        "filename": file.filename or "unknown.jpg",
        "image_url": secure_url,
        "cloudinary_public_id": upload_res.get("public_id"),  # Useful for deleting files later
        "diagnosis": result,
        "analyzed_at": datetime.now(timezone.utc),
    }

    insert_res = await history_collection.insert_one(db_record)
    db_record["_id"] = str(insert_res.inserted_id)
    print(f"Analysis result for {file.filename}")
    return db_record



# async def process_single_image(file: UploadFile):
#     """Process a single image for disease detection"""
#     content =await file.read()

#     validation =validate_image(content, file.content_type)
#     if not validation["is_valid"]:
#         raise HTTPException(status_code=400, detail=validation["message"])
    
#     processed =resize_image_if_needed(content)
#     ext =file.filename.split(".")[-1] if "." in file.filename else "jpg"
#     unique_name =f"{uuid.uuid4().hex}.{ext}"

#     save_image(processed, "uploads", unique_name)
#     result = await vision_analyse_image(processed, file.content_type)
#     db_record = {
#         "filename": file.filename or "unknown.jpg",
#         "image_url": f"/uploads/{unique_name}", # Saves the path for the React frontend
#         "diagnosis": result,
#         "analyzed_at": datetime.now(timezone.utc)
#     }
#     await history_collection.insert_one(db_record)
#     print(f"Analysis result for {file.filename}")
#     return result


@router.post("/")
async def analyse_image(file: UploadFile =File(...)):
    """Endpoint to upload an image for disease detection"""

    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid file type, Please Upload an Image.")
    result = await process_single_image(file)

    return {
        "message": "Photo Uploaded Successfully",
        "result": result
    }


@router.post("/batch")
# async def get_batch():
async def analyse_batch_images(files: List[UploadFile] = File(...)):
        """Endpoint to upload multiple images for concurrent disease detection"""

        for file in files:
            if not file.content_type.startswith("image/"):
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid file type for {file.filename}. Please upload only images."
                )

        tasks = [process_single_image(file) for file in files]
        results =await asyncio.gather(*tasks, return_exceptions=True)

        batch_report =[]
        for file, result in zip(files, results):
            if isinstance(result, Exception):
                batch_report.append({
                "filename": file.filename,
                "status": "failed",
                "error": str(result)
            })
            else:
                batch_report.append({
                    "filename": file.filename,
                    "status":"success",
                    "diagnosis": result
                })
        return {
            "message": f"Successfully processed {len(files)} images.",
        "results": batch_report
        }


@router.get("/")
async def get_all_analyses(limit: int = 20):
    """Retrieve a list of all historical disease analyses performed"""
    analyses = []
    cursor = history_collection.find({}).sort("_id", -1).limit(limit)

    async for document in cursor:
        document["_id"] = str(document["_id"])
        analyses.append(document)

    return {
        "count": len(analyses),
        "history": analyses
    }





@router.get("/{analyses_id}")
async def get_analysis_by_id(analyses_id: str):
    """Retreive details of a specific analysis by its Id in Database"""


    try:
        obj_id =ObjectId(analyses_id)
    except InvalidId:
        raise HTTPException(
                status_code=400,
                detail="Invalid Analysis ID format"
            )

    document =await history_collection.find_one({"_id": obj_id})

    if not document:
        raise HTTPException(
                status_code=404,
                detail=f"Analysis with {obj_id} not found"
            )


    document["_id"] =str(document["_id"])
    return document


    



