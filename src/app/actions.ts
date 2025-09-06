
'use server';

import fs from 'fs/promises';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'data', 'faces.json');

interface KnownFace {
  label: string;
  images: string[];
}

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
