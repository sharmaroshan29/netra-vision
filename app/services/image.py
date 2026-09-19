from PIL import Image
import io
import os

ALLOWED_IMAGE_TYPES =["image/jpeg", "image/png"]
MAX_IMAGE_DIMENSION =2048


def validate_image(content: bytes, content_type: str) -> dict:
    """Validate the uploaded image content and type."""

    if not content_type.startswith("image/"):
        return {
            "is_valid": False,
            "message": "File must be an Image"
        }
    if content_type not in ALLOWED_IMAGE_TYPES:
        return {
                    "is_valid": False,
                    "message": "Only JPG and PNG format is supported"
                }

    size_mb =len(content)/(1024*1024)
    if size_mb>15:
        return {
            "is_valid": False,
            "message": "File size must be less than 15 mb"
        }

    image =Image.open(io.BytesIO(content))
    width, height =image.size

    return {
        "is_valid": True,
        "message": "Image is Valid",
        "width": width,
        "height":height,
        "size_mb": size_mb
    }

def resize_image_if_needed(content: bytes) ->bytes:
    """Resize the images if it needed"""

    image =Image.open(io.BytesIO(content))
    width, height =image.size
    if width <= MAX_IMAGE_DIMENSION and height <= MAX_IMAGE_DIMENSION:
        return content #NO resizing is required

    if width > height:
        new_width =MAX_IMAGE_DIMENSION
        new_height =int((MAX_IMAGE_DIMENSION/width)*height)
    else:
        new_height =MAX_IMAGE_DIMENSION
        new_width =int((MAX_IMAGE_DIMENSION/height)*width)

    resized_image =image.resize((new_width, new_height), Image.Resampling.LANCZOS) 
    output =io.BytesIO()
    resized_image.save(output, format=image.format)
    return output.getvalue()



def save_image(content: bytes, upload_path: str, filename: str) -> str:
    """Save the image to disk"""

    os.makedirs(upload_path, exist_ok=True)
    file_path =os.path.join(upload_path, filename)

    with open(file_path, "wb") as f:
        f.write(content)

    return file_path


    

