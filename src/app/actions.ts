
'use server';

import fs from 'fs/promises';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'data', 'faces.json');

interface KnownFace {
  label: string;
  images: string[];
}

// MOCK DATA - In a real app, this would be a database call
const mockAttendance: Record<string, Record<string, 'Present' | 'Absent' | 'Leave' | 'Holiday'>> = {
    "Sanju": {
        "2024-07-20": "Present",
        "2024-07-21": "Present",
        "2024-07-22": "Absent",
    },
    "Cotton Collector": {
        "2024-07-20": "Leave",
        "2024-07-21": "Present",
    }
};

async function ensureDataFileExists() {
  try {
    await fs.access(dataFilePath);
  } catch (error) {
    await fs.mkdir(path.dirname(dataFilePath), { recursive: true });
    await fs.writeFile(dataFilePath, JSON.stringify([]));
  }
}

export async function getKnownFaces(): Promise<KnownFace[]> {
  await ensureDataFileExists();
  const fileContent = await fs.readFile(dataFilePath, 'utf-8');
  try {
    const faces = JSON.parse(fileContent);
    return faces;
  } catch {
    return [];
  }
}

export async function saveKnownFace(face: { label: string; image: string }): Promise<void> {
    const faces = await getKnownFaces();
    const existingFace = faces.find(f => f.label === face.label);

    if (existingFace) {
        existingFace.images.push(face.image);
    } else {
        faces.push({ label: face.label, images: [face.image] });
    }
    
    await fs.writeFile(dataFilePath, JSON.stringify(faces, null, 2));
}

export async function deleteKnownFace(label: string): Promise<void> {
    let faces = await getKnownFaces();
    faces = faces.filter(f => f.label !== label);
    await fs.writeFile(dataFilePath, JSON.stringify(faces, null, 2));
}

export async function getAttendanceForStudent(studentId: string, date: string): Promise<'Present' | 'Absent' | 'Leave' | 'Holiday' | 'Not Marked'> {
  // This is a mock function. In a real app, you'd query Firestore.
  // Example: db.collection('attendance').where('studentId', '==', studentId).where('date', '==', date).get()
  
  // For demo purposes, we'll use the mock data.
  // We'll also simulate a holiday.
  if (new Date(date).getDay() === 0) return 'Holiday'; // Sunday is a holiday
  
  const studentAttendance = mockAttendance[studentId];
  if (studentAttendance && studentAttendance[date]) {
    return studentAttendance[date];
  }
  
  return 'Not Marked';
}

export async function takeAttendance(studentId: string, date: string, status: 'Present' | 'Absent' | 'Leave'): Promise<void> {
  // This is a mock function. In a real app, you'd write to Firestore.
  // Example: db.collection('attendance').add({ studentId, date, status, day: new Date(date).toLocaleString('en-us', { weekday: 'long' }) })
  console.log(`Marking ${studentId} as ${status} for ${date}`);
  
  if (!mockAttendance[studentId]) {
    mockAttendance[studentId] = {};
  }
  mockAttendance[studentId][date] = status;
  
  // This is just to demonstrate it works without a real DB.
  // In a real app, this server action would just update Firestore.
}
