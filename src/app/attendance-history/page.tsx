
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getKnownFaces, getAttendanceForDate } from '@/app/actions';
import { Loader2 } from 'lucide-react';
import MainLayout from '@/components/main-layout';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import Image from 'next/image';

interface Student {
  label: string;
  class: string;
  rollNo: string;
  images: string[];
}

interface AttendanceRecord {
  status: 'Present' | 'Absent' | 'Leave' | 'Holiday' | 'Not Marked';
}

export default function AttendanceRegisterPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord['status']>>({});
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (selectedDate: Date) => {
    setLoading(true);
    try {
      const knownFaces = await getKnownFaces();
      knownFaces.sort((a, b) => parseInt(a.rollNo, 10) - parseInt(b.rollNo, 10));
      setStudents(knownFaces);

      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const attendanceData = await getAttendanceForDate(formattedDate);
      setAttendance(attendanceData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (date) {
      fetchData(date);
    }
  }, [date, fetchData]);

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
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
           <Card>
             <CardContent className="p-0">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    fromDate={new Date('2025-08-01')}
                    className="rounded-md w-full"
                />
             </CardContent>
           </Card>
        </div>
        <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Daily Attendance Report</CardTitle>
                <CardDescription>
                  Showing attendance for {date ? format(date, 'PPP') : 'No date selected'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">Photo</TableHead>
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
                            <TableCell>
                                <Image 
                                    src={student.images[0]} 
                                    alt={student.label}
                                    width={40}
                                    height={40}
                                    className="rounded-full object-cover w-10 h-10"
                                />
                            </TableCell>
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
                          <TableCell colSpan={5} className="h-24 text-center">
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
      </div>
    </MainLayout>
  );
}
