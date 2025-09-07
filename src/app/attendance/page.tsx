
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from '@/components/ui/button';
import { getKnownFaces, getAttendanceForStudent, takeAttendance } from '@/app/actions';
import { Loader2, CheckCircle, XCircle, Info, Plane } from 'lucide-react';
import MainLayout from '@/components/main-layout';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface KnownFace {
  label: string;
  images: string[];
}

type AttendanceStatus = 'Present' | 'Absent' | 'Leave' | 'Holiday' | 'Not Marked';

export default function AttendancePage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [students, setStudents] = useState<KnownFace[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus>('Not Marked');
  const { toast } = useToast();

  const fetchStudents = useCallback(async () => {
    try {
      const knownFaces = await getKnownFaces();
      setStudents(knownFaces);
      if (knownFaces.length > 0) {
        setSelectedStudent(knownFaces[0].label);
      }
    } catch (error) {
      console.error("Failed to load students:", error);
    } finally {
      setLoadingStudents(false);
    }
  }, []);

  const fetchAttendance = useCallback(async () => {
    if (!selectedStudent || !date) return;
    setLoadingAttendance(true);
    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      const status = await getAttendanceForStudent(selectedStudent, formattedDate);
      setAttendanceStatus(status);
    } catch (error) {
      console.error("Failed to fetch attendance:", error);
    } finally {
      setLoadingAttendance(false);
    }
  }, [selectedStudent, date]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const handleMarkAttendance = async (status: 'Present' | 'Absent' | 'Leave') => {
    if (!selectedStudent || !date) return;
    
    setLoadingAttendance(true);
    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      await takeAttendance(selectedStudent, formattedDate, status);
      setAttendanceStatus(status); // Optimistically update UI
      toast({
        title: 'Success',
        description: `${selectedStudent}'s attendance marked as ${status}.`,
      });
    } catch (error) {
      console.error("Error marking attendance:", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to mark attendance.',
      });
    } finally {
      setLoadingAttendance(false);
    }
  };
  
  const StatusDisplay = () => {
    if (loadingAttendance) {
        return (
            <div className="flex items-center text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Loading...</span>
            </div>
        );
    }
    
    switch (attendanceStatus) {
        case 'Present':
            return <div className="flex items-center text-green-600"><CheckCircle className="mr-2 h-4 w-4" />Present</div>;
        case 'Absent':
            return <div className="flex items-center text-red-600"><XCircle className="mr-2 h-4 w-4" />Absent</div>;
        case 'Leave':
            return <div className="flex items-center text-blue-600"><Plane className="mr-2 h-4 w-4" />On Leave</div>;
        case 'Holiday':
            return <div className="flex items-center text-gray-500"><Info className="mr-2 h-4 w-4" />Holiday</div>;
        default:
            return <div className="flex items-center text-gray-500"><Info className="mr-2 h-4 w-4" />Not Marked</div>;
    }
  };


  return (
    <MainLayout title="Attendance Manager">
      <div className="w-full grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Student & Date</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingStudents ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger>
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
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border not-prose"
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Mark Attendance</CardTitle>
                    <CardDescription>
                        {date ? format(date, "PPP") : 'No date selected'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <span className="font-medium">Status:</span>
                        <div className="font-semibold text-lg">
                            <StatusDisplay />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <Button 
                          onClick={() => handleMarkAttendance('Present')} 
                          disabled={loadingAttendance || attendanceStatus === 'Holiday'}
                          className="bg-green-500 hover:bg-green-600">
                            Present
                        </Button>
                        <Button 
                          onClick={() => handleMarkAttendance('Absent')} 
                          disabled={loadingAttendance || attendanceStatus === 'Holiday'}
                          variant="destructive">
                            Absent
                        </Button>
                        <Button 
                          onClick={() => handleMarkAttendance('Leave')} 
                          disabled={loadingAttendance || attendanceStatus === 'Holiday'}
                          className="bg-blue-500 hover:bg-blue-600">
                            On Leave
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </MainLayout>
  );
}
