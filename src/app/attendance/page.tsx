
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getKnownFaces } from '@/app/actions';
import { Loader2 } from 'lucide-react';
import MainLayout from '@/components/main-layout';

// Mock data structure - replace with actual data fetching
interface AttendanceRecord {
  date: string;
  status: 'Present' | 'Absent' | 'Leave' | 'Holiday';
}

interface KnownFace {
  label: string;
  images: string[];
}


export default function AttendancePage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [students, setStudents] = useState<KnownFace[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStudents() {
      try {
        const knownFaces = await getKnownFaces();
        setStudents(knownFaces);
        if (knownFaces.length > 0) {
          setSelectedStudent(knownFaces[0].label);
        }
      } catch (error) {
        console.error("Failed to load students:", error);
      } finally {
        setLoading(false);
      }
    }
    loadStudents();
  }, []);
  
  useEffect(() => {
    // This is where you would fetch attendance data for the selected student and month
    // For now, we'll use mock data
    if (selectedStudent) {
      const mockData: AttendanceRecord[] = [
        { date: '2024-07-01', status: 'Present' },
        { date: '2024-07-02', status: 'Present' },
        { date: '2024-07-03', status: 'Absent' },
        { date: '2024-07-04', status: 'Present' },
        { date: '2024-07-05', status: 'Holiday' },
      ];
      setAttendance(mockData);
    }
  }, [selectedStudent, date]);

  const getDayClassName = (day: Date) => {
    const record = attendance.find(a => new Date(a.date).toDateString() === day.toDateString());
    if (record) {
      switch (record.status) {
        case 'Present': return 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-100';
        case 'Absent': return 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-100';
        case 'Leave': return 'bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
        case 'Holiday': return 'bg-gray-300 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
      }
    }
    return '';
  };

  return (
    <MainLayout title="Attendance History">
      <div className="w-full space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>View Attendance</CardTitle>
            <CardDescription>Select a student to view their monthly attendance.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading students...</span>
              </div>
            ) : (
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger className="w-full md:w-[280px]">
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map(student => (
                    <SelectItem key={student.label} value={student.label}>
                      {student.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-2 sm:p-4">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              month={date}
              onMonthChange={setDate}
              className="p-0"
              classNames={{
                day_selected: "bg-primary text-primary-foreground",
                day: "h-10 w-10 sm:h-12 sm:w-12", // Larger day cells
              }}
              modifiers={{
                present: attendance.filter(a => a.status === 'Present').map(a => new Date(a.date)),
                absent: attendance.filter(a => a.status === 'Absent').map(a => new Date(a.date)),
                leave: attendance.filter(a => a.status === 'Leave').map(a => new Date(a.date)),
                holiday: attendance.filter(a => a.status === 'Holiday').map(a => new Date(a.date)),
              }}
              modifiersClassNames={{
                present: 'bg-green-500/30 text-primary-foreground rounded-md',
                absent: 'bg-red-500/30 text-primary-foreground rounded-md',
                leave: 'bg-yellow-500/30 text-primary-foreground rounded-md',
                holiday: 'bg-muted-foreground/30 rounded-md',
              }}
            />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
