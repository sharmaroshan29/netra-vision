import base64
import json
import os
from google import genai
from google.genai import types

# proxy_url = "http://edcguest:edcguest@172.31.102.29:3128"
# os.environ["HTTP_PROXY"] = proxy_url
# os.environ["HTTPS_PROXY"] = proxy_url
# os.environ["NO_PROXY"] = "127.0.0.1,localhost"

client =genai.Client()


CROP_ANALYSIS_PROMPT ="""
You are an expert agricultural scientist specializing in crop disease detection.
Analyze this image of a crop/plant and provide a detailed disease assessment.

Provide your analysis as a JSON object with exactly this structure:

{
"crop_detected": "Name of the crop or plant visible in the image",
"severity": "healthy" or "mild" or "moderate" or "severe" or "critical",
"diseases": [
        {
            "name": "Disease name",
            "confidence": 0.0 to 1.0,
            "description": "Brief description of the disease and visible symptoms"
        }
    ],
"treatments": [
        {
            "treatment_name": "Name of treatment",
            "treatment_type": "organic" or "chemical" or "preventive",
            "instructions": "Step by step treatment instructions",
            "urgency": "immediate" or "within_week" or "seasonal"
        }
    ],
    "overall_health": "One sentence summary of plant health",
    "additional_notes": "Any other observations or recommendations"
}



"""
client = genai.Client()

async def analyse_image(image_content: bytes, content_type: str):
    """Analyse the image content using Google GenAI Interactions API"""
    
    # 1. The Interactions API requires images to be base64 encoded inline
    base64_image = base64.b64encode(image_content).decode('utf-8')
    
    # 2. Use client.aio for async, and the new interactions.create method
    interaction = await client.aio.interactions.create(
        model="gemini-3.5-flash", 
        input=[
            {"type": "text", "text": CROP_ANALYSIS_PROMPT},
            {
                "type": "image",
                "data": base64_image,
                "mime_type": content_type
            }
        ]
    )
    raw_text = interaction.output_text.strip()
    print(f"GenAI raw response: {raw_text}")

    # Remove markdown code fences if present
    if raw_text.startswith("```json"):
        raw_text = raw_text[7:]
    elif raw_text.startswith("```"):
        raw_text = raw_text[3:]
    
    if raw_text.endswith("```"):
        raw_text = raw_text[:-3]

    raw_text = raw_text.strip()

    return json.loads(raw_text)
   
    
    # return json.loads(interaction.output_text)


# client =AsyncGroq()
# async def analyse_image(image_content: bytes, content_type: str):
#     """Analys the image content using Groq for disease detection"""
#     base64_image = base64.b64encode(image_content).decode('utf-8')
#     response = await client.chat.completions.create(
#         model="qwen/qwen3.8-27b",
#         messages=[
#             {
#                 "role": "user",
#                 "content": [
#                     {
#                         "type": "text", 
#                         "text": CROP_ANALYSIS_PROMPT
#                     },
#                     {
#                         "type": "image_url", 
#                         "image_url": {
#                             # Groq expects a formatted data URI
#                             "url": f"data:{content_type};base64,{base64_image}"
#                         }
#                     }
#                 ]
#             }
#         ]
#     )
#     response_text = response.choices[0].message.content
#     print(f"Groq interaction response: {response_text}")
#     return json.loads(response_text)







