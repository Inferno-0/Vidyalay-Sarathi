from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Dict, Optional, Literal
import json
import os
import aiofiles
from datetime import datetime, date
import asyncio
from pathlib import Path

# Import the AI service we created earlier
from ai.ai_service import ai

# Initialize FastAPI app
app = FastAPI(title="Face Recognition Attendance System", version="1.0.0")

# CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # Add your frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data file paths
FACES_DATA_PATH = Path("data/faces.json")
ATTENDANCE_DATA_PATH = Path("data/attendance.json")

# Type definitions (Pydantic models)
class KnownFace(BaseModel):
    label: str
    class_: str = ""  # Using class_ because class is a Python keyword
    rollNo: str
    images: List[str]

    class Config:
        # Allow using 'class' in JSON but map to 'class_' in Python
        fields = {"class_": "class"}

AttendanceStatus = Literal["Present", "Absent", "Leave", "Holiday", "Not Marked"]

class AttendanceRecord(BaseModel):
    studentId: str
    date: str
    status: Literal["Present", "Absent", "Leave"]

class FaceData(BaseModel):
    label: str
    class_: str = ""
    rollNo: str
    images: List[str]

    class Config:
        fields = {"class_": "class"}

class UpdateFaceData(BaseModel):
    name: str
    class_: str = ""
    rollNo: str

    class Config:
        fields = {"class_": "class"}

# MOCK HOLIDAYS - In a real app, this would be a database
MOCK_HOLIDAYS = [
    {"date": "2025-08-15", "name": "Independence Day"},
    {"date": "2025-10-02", "name": "Gandhi Jayanti"},
]

# Utility functions
async def ensure_data_file_exists(file_path: Path, default_content: str = "{}"):
    """Ensure data file exists, create if it doesn't"""
    try:
        if not file_path.exists():
            # Create directory if it doesn't exist
            file_path.parent.mkdir(parents=True, exist_ok=True)
            async with aiofiles.open(file_path, 'w') as f:
                await f.write(default_content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating data file: {str(e)}")

async def read_json_file(file_path: Path, default_value=None):
    """Read JSON file safely"""
    await ensure_data_file_exists(file_path, json.dumps(default_value or {}))
    try:
        async with aiofiles.open(file_path, 'r') as f:
            content = await f.read()
            return json.loads(content)
    except json.JSONDecodeError:
        return default_value or {}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading file: {str(e)}")

async def write_json_file(file_path: Path, data):
    """Write JSON file safely"""
    try:
        file_path.parent.mkdir(parents=True, exist_ok=True)
        async with aiofiles.open(file_path, 'w') as f:
            await f.write(json.dumps(data, indent=2))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error writing file: {str(e)}")

# ========== Face Management Endpoints ==========

@app.get("/api/faces", response_model=List[KnownFace])
async def get_known_faces():
    """Get all known faces"""
    faces_data = await read_json_file(FACES_DATA_PATH, [])
    return faces_data

@app.post("/api/faces")
async def save_known_face(face_data: FaceData):
    """Save a new known face or update existing one"""
    try:
        faces = await read_json_file(FACES_DATA_PATH, [])
        
        # Find existing face
        existing_face = None
        for i, f in enumerate(faces):
            if f.get("label") == face_data.label:
                existing_face = i
                break
        
        face_dict = {
            "label": face_data.label,
            "class": face_data.class_,
            "rollNo": face_data.rollNo,
            "images": face_data.images
        }
        
        if existing_face is not None:
            # Update existing face
            faces[existing_face]["images"].extend(face_data.images)
            faces[existing_face]["class"] = face_data.class_
            faces[existing_face]["rollNo"] = face_data.rollNo
        else:
            # Add new face
            faces.append(face_dict)
        
        await write_json_file(FACES_DATA_PATH, faces)
        return {"message": "Face saved successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving face: {str(e)}")

@app.put("/api/faces/{label}")
async def update_known_face(label: str, update_data: UpdateFaceData):
    """Update an existing known face"""
    try:
        faces = await read_json_file(FACES_DATA_PATH, [])
        
        # Find the face to update
        face_index = None
        for i, f in enumerate(faces):
            if f.get("label") == label:
                face_index = i
                break
        
        if face_index is None:
            raise HTTPException(status_code=404, detail="Face not found")
        
        # Update the face data
        faces[face_index]["label"] = update_data.name
        faces[face_index]["class"] = update_data.class_
        faces[face_index]["rollNo"] = update_data.rollNo
        
        await write_json_file(FACES_DATA_PATH, faces)
        return {"message": "Face updated successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating face: {str(e)}")

@app.delete("/api/faces/{label}")
async def delete_known_face(label: str):
    """Delete a known face"""
    try:
        faces = await read_json_file(FACES_DATA_PATH, [])
        
        # Filter out the face to delete
        original_count = len(faces)
        faces = [f for f in faces if f.get("label") != label]
        
        if len(faces) == original_count:
            raise HTTPException(status_code=404, detail="Face not found")
        
        await write_json_file(FACES_DATA_PATH, faces)
        return {"message": "Face deleted successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting face: {str(e)}")

# ========== Attendance Management Endpoints ==========

async def get_attendance_log() -> Dict:
    """Get the attendance log from file"""
    return await read_json_file(ATTENDANCE_DATA_PATH, {})

@app.get("/api/attendance/student/{student_id}")
async def get_attendance_for_student(student_id: str, date: str):
    """Get attendance status for a specific student on a specific date"""
    try:
        # Session start date
        session_start_date = datetime(2025, 8, 1).date()
        today = datetime.now().date()
        current_date = datetime.strptime(date, "%Y-%m-%d").date()
        
        if current_date < session_start_date:
            return {"status": "Not Marked"}
        
        # Check for holidays and weekends
        if current_date.weekday() == 6:  # Sunday (0=Monday, 6=Sunday)
            return {"status": "Holiday"}
        
        # Check if it's a holiday
        is_holiday = any(h["date"] == date for h in MOCK_HOLIDAYS)
        if is_holiday:
            return {"status": "Holiday"}
        
        # Check the attendance log
        attendance_log = await get_attendance_log()
        student_attendance = attendance_log.get(student_id, {})
        
        if date in student_attendance:
            return {"status": student_attendance[date]}
        
        # Determine default status
        if current_date > today:
            return {"status": "Not Marked"}  # Future dates
        elif current_date <= today:
            return {"status": "Absent"}  # Past or current date with no record
        
        return {"status": "Not Marked"}
    
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting attendance: {str(e)}")

@app.get("/api/attendance/date/{date}")
async def get_attendance_for_date(date: str):
    """Get attendance for all students on a specific date"""
    try:
        faces = await read_json_file(FACES_DATA_PATH, [])
        attendance_data = {}
        
        for student in faces:
            student_id = student.get("label")
            if student_id:
                # Get attendance status for this student
                response = await get_attendance_for_student(student_id, date)
                attendance_data[student_id] = response["status"]
        
        return attendance_data
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting date attendance: {str(e)}")

@app.post("/api/attendance")
async def take_attendance(attendance: AttendanceRecord):
    """Mark attendance for a student"""
    try:
        attendance_log = await get_attendance_log()
        
        # Initialize student record if it doesn't exist
        if attendance.studentId not in attendance_log:
            attendance_log[attendance.studentId] = {}
        
        # Set the attendance status
        attendance_log[attendance.studentId][attendance.date] = attendance.status
        
        await write_json_file(ATTENDANCE_DATA_PATH, attendance_log)
        return {"message": "Attendance marked successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error marking attendance: {str(e)}")

# ========== AI Integration Endpoints ==========

@app.post("/api/ai/analyze-face")
async def analyze_face_with_ai(prompt: str):
    """Use AI to analyze face or generate insights"""
    try:
        result = await ai.generate_content(prompt)
        return {"result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI analysis error: {str(e)}")

# ========== Health Check ==========

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "Face Recognition Attendance API is running!"}

@app.get("/health")
async def health_check():
    """Detailed health check"""
    try:
        # Test file access
        faces_exist = FACES_DATA_PATH.exists() or True  # Will be created if needed
        attendance_exist = ATTENDANCE_DATA_PATH.exists() or True  # Will be created if needed
        
        # Test AI service
        try:
            await ai.generate_content("test")
            ai_status = "working"
        except:
            ai_status = "error"
        
        return {
            "status": "healthy",
            "faces_data": "accessible" if faces_exist else "error",
            "attendance_data": "accessible" if attendance_exist else "error",
            "ai_service": ai_status,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)