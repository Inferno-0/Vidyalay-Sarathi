
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { getKnownFaces, getAttendanceForDate } from '@/app/actions';
import { Loader2 } from 'lucide-react';
import MainLayout from '@/components/main-layout';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface Student {
  label: string;
  class: string;
  rollNo: string;
}

interface AttendanceRecord {
  status: 'Present' | 'Absent' | 'Leave' | 'Holiday' | 'Not Marked';
}

export default function AttendanceHistoryPage() {
  const [date, setDate] = useState<Date>(new Date());
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord['status']>>({});
  const [loading, setLoading] = useState(true);

  const fetchStudents = useCallback(async () => {
    try {
      const knownFaces = await getKnownFaces();
      setStudents(knownFaces);
    } catch (error) {
      console.error("Failed to load students:", error);
    }
  }, []);

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      const attendanceData = await getAttendanceForDate(formattedDate);
      setAttendance(attendanceData);
    } catch (error) {
      console.error("Failed to load attendance:", error);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance, date]);

  const getStatusBadge = (status: AttendanceRecord['status']) => {
    switch (status) {
      case 'Present': return <Badge variant="default" className="bg-green-600">Present</Badge>;
      case 'Absent': return <Badge variant="destructive">Absent</Badge>;
      case 'Leave': return <Badge variant="secondary" className="bg-blue-600 text-white">On Leave</Badge>;
      case 'Holiday': return <Badge variant="outline">Holiday</Badge>;
      default: return <Badge variant="outline">Not Marked</Badge>;
    }
  };

  return (
    <MainLayout title="Attendance History">
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
                <CardTitle>Select Date</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => newDate && setDate(newDate)}
                className="rounded-md border"
              />
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Attendance Report</CardTitle>
                    <CardDescription>{format(date, 'PPP')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 max-h-[60vh] overflow-y-auto">
                  {loading ? (
                     <div className="text-center py-8"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>
                  ) : (
                    students.map(student => (
                        <div key={student.label} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div>
                                <p className="font-medium text-lg">{student.label}</p>
                                <p className="text-sm text-muted-foreground">{`Class: ${student.class} | Roll: ${student.rollNo}`}</p>
                            </div>
                           <div className="flex items-center gap-2">
                               {getStatusBadge(attendance[student.label] || 'Not Marked')}
                           </div>
                        </div>
                    ))
                  )}
                </CardContent>
            </Card>
        </div>
      </div>
    </MainLayout>
  );
}
