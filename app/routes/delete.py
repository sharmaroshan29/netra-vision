import os
from pathlib import Path
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, HTTPException, status
from services.database import history_collection

router = APIRouter(prefix="/delete", tags=["Delete"])

@router.delete("/{analysis_id}", status_code=status.HTTP_200_OK)
async def delete_analysis_by_id(analysis_id: str):
    """Delete an analysis record from MongoDB and remove its image from disk."""
    # 1. Validate ObjectId
    try:
        obj_id = ObjectId(analysis_id)
    except InvalidId:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid analysis ID format. It must be a 24-character hex string."
        )

    # 2. Check if the record exists
    document = await history_collection.find_one({"_id": obj_id})
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found"
        )

    # 3. Clean up the physical file on disk
    image_url = document.get("image_url")
    if image_url:
        # Strip leading slash so Path resolves relative to current working directory
        relative_path = image_url.lstrip("/\\")
        file_path = Path(relative_path)

        try:
            if file_path.is_file():
                file_path.unlink()
        except OSError as err:
            # Log error if needed; continue to ensure database cleanup
            print(f"Warning: Failed to delete file {file_path}: {err}")

    # 4. Remove the record from MongoDB
    delete_result = await history_collection.delete_one({"_id": obj_id})
    if delete_result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete analysis from database."
        )

    return {
        "status": "success",
        "message": f"Analysis Id {analysis_id} deleted successfully."
    }