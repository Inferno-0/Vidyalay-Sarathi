
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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

export default function AttendanceRegisterPage() {
  const [date] = useState(new Date()); // Date is now fixed to the current day
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord['status']>>({});
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const knownFaces = await getKnownFaces();
      // Sort students by roll number
      knownFaces.sort((a, b) => parseInt(a.rollNo, 10) - parseInt(b.rollNo, 10));
      setStudents(knownFaces);

      const formattedDate = format(date, 'yyyy-MM-dd');
      const attendanceData = await getAttendanceForDate(formattedDate);
      setAttendance(attendanceData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
    <MainLayout title="Attendance Register">
      <div className="w-full">
        <Card>
          <CardHeader>
            <CardTitle>Daily Attendance Report</CardTitle>
            <CardDescription>Showing attendance for {format(date, 'PPP')}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Roll No.</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.length > 0 ? (
                    students.map(student => (
                      <TableRow key={student.rollNo}>
                        <TableCell className="font-medium">{student.rollNo}</TableCell>
                        <TableCell>{student.label}</TableCell>
                        <TableCell>{student.class}</TableCell>
                        <TableCell className="text-right">
                          {getStatusBadge(attendance[student.label] || 'Not Marked')}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        No students enrolled yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
