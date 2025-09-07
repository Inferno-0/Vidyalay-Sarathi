
'use server';

import fs from 'fs/promises';
import path from 'path';

const facesDataPath = path.join(process.cwd(), 'data', 'faces.json');
const attendanceDataPath = path.join(process.cwd(), 'data', 'attendance.json');


interface KnownFace {
  label: string;
  class: string;
  rollNo: string;
  images: string[];
}

type AttendanceStatus = 'Present' | 'Absent' | 'Leave' | 'Holiday' | 'Not Marked';
type AttendanceLog = Record<string, Record<string, AttendanceStatus>>;


// MOCK HOLIDAYS - In a real app, this would be a database call
const mockHolidays = [
    { date: "2025-08-15", name: "Independence Day" },
    { date: "2025-10-02", name: "Gandhi Jayanti" },
];

async function ensureDataFileExists(filePath: string, defaultContent: string) {
  try {
    await fs.access(filePath);
  } catch (error) {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, defaultContent);
  }
}

// ========== Face Management Functions ==========

export async function getKnownFaces(): Promise<KnownFace[]> {
  await ensureDataFileExists(facesDataPath, '[]');
  const fileContent = await fs.readFile(facesDataPath, 'utf-8');
  try {
    return JSON.parse(fileContent);
  } catch {
    return [];
  }
}

export async function saveKnownFace(face: { label: string; class: string; rollNo: string; images: string[] }): Promise<void> {
    const faces = await getKnownFaces();
    const existingFace = faces.find(f => f.label === face.label);

    if (existingFace) {
        existingFace.images.push(...face.images);
        existingFace.class = face.class;
        existingFace.rollNo = face.rollNo;
    } else {
        faces.push({ label: face.label, class: face.class, rollNo: face.rollNo, images: face.images });
    }
    
    await fs.writeFile(facesDataPath, JSON.stringify(faces, null, 2));
}

export async function updateKnownFace(label: string, newData: { name: string; class: string; rollNo: string }): Promise<void> {
    let faces = await getKnownFaces();
    const faceIndex = faces.findIndex(f => f.label === label);

    if (faceIndex > -1) {
        faces[faceIndex].label = newData.name;
        faces[faceIndex].class = newData.class;
        faces[faceIndex].rollNo = newData.rollNo;
    } else {
        throw new Error("Face not found");
    }

    await fs.writeFile(facesDataPath, JSON.stringify(faces, null, 2));
}

export async function deleteKnownFace(label: string): Promise<void> {
    let faces = await getKnownFaces();
    faces = faces.filter(f => f.label !== label);
    await fs.writeFile(facesDataPath, JSON.stringify(faces, null, 2));
}


// ========== Attendance Management Functions ==========

async function getAttendanceLog(): Promise<AttendanceLog> {
    await ensureDataFileExists(attendanceDataPath, '{}');
    const fileContent = await fs.readFile(attendanceDataPath, 'utf-8');
    try {
        return JSON.parse(fileContent);
    } catch {
        return {};
    }
}

export async function getAttendanceForStudent(studentId: string, date: string): Promise<AttendanceStatus> {
  const sessionStartDate = new Date('2025-08-01');
  const today = new Date();
  today.setHours(0, 0, 0, 0); 
  const currentDate = new Date(date);
  currentDate.setHours(0,0,0,0);
  
  if (currentDate > today) return 'Not Marked';
  if (currentDate < sessionStartDate) return 'Not Marked';
  
  if (currentDate.getDay() === 0) return 'Holiday'; 
  const isHoliday = mockHolidays.some(h => h.date === date);
  if (isHoliday) return 'Holiday';

  const attendanceLog = await getAttendanceLog();
  const studentAttendance = attendanceLog[studentId];
  
  if (studentAttendance && studentAttendance[date]) {
    return studentAttendance[date];
  }
  
  // If today is the date being checked, and no record exists, they are absent.
  // Otherwise, it's just not marked yet.
  if(currentDate.getTime() < today.getTime()) return 'Absent';

  return 'Not Marked';
}

export async function getAttendanceForDate(date: string): Promise<Record<string, AttendanceStatus>> {
  const students = await getKnownFaces();
  const attendanceData: Record<string, AttendanceStatus> = {};

  for (const student of students) {
    attendanceData[student.label] = await getAttendanceForStudent(student.label, date);
  }

  return attendanceData;
}

export async function takeAttendance(studentId: string, date: string, status: 'Present' | 'Absent' | 'Leave'): Promise<void> {
  const attendanceLog = await getAttendanceLog();
  
  if (!attendanceLog[studentId]) {
    attendanceLog[studentId] = {};
  }
  attendanceLog[studentId][date] = status;

  await fs.writeFile(attendanceDataPath, JSON.stringify(attendanceLog, null, 2));
}
