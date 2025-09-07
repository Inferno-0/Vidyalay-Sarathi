
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2, Pencil } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { getKnownFaces, deleteKnownFace, updateKnownFace } from '@/app/actions';
import MainLayout from '@/components/main-layout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface KnownFace {
  label: string;
  class: string;
  rollNo: string;
  images: string[];
}

export default function KnownFacesPage() {
  const [knownFaces, setKnownFaces] = useState<KnownFace[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFace, setSelectedFace] = useState<KnownFace | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({ name: '', class: '', rollNo: '' });
  const { toast } = useToast();

  const loadFaces = useCallback(async () => {
    try {
      const faces = await getKnownFaces();
      setKnownFaces(faces);
    } catch (error) {
      console.error("Failed to load faces:", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not load known faces.',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadFaces();
  }, [loadFaces]);

  const openDeleteDialog = (face: KnownFace) => {
    setSelectedFace(face);
    setIsDeleteDialogOpen(true);
  };

  const openEditDialog = (face: KnownFace) => {
    setSelectedFace(face);
    setEditFormData({ name: face.label, class: face.class, rollNo: face.rollNo });
    setIsEditDialogOpen(true);
  };


  const handleDeleteFace = async () => {
    if (!selectedFace) return;

    try {
        await deleteKnownFace(selectedFace.label);
        
        setKnownFaces(prevFaces => prevFaces.filter(face => face.label !== selectedFace.label));

        toast({
            title: 'Face Deleted',
            description: `${selectedFace.label} has been removed.`,
        });
    } catch (error) {
        console.error("Failed to delete face:", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not delete the face. Please try again.',
        });
    }
    setIsDeleteDialogOpen(false);
    setSelectedFace(null);
  };

  const handleEditFace = async () => {
    if (!selectedFace || !editFormData.name) return;

    try {
      await updateKnownFace(selectedFace.label, editFormData);
      await loadFaces();
      toast({
        title: 'Details Updated',
        description: `Details for ${editFormData.name} have been updated.`,
      });
    } catch (error) {
      console.error("Failed to update face:", error);
      toast({
        variant: 'destructive',
        title: 'Update Error',
        description: 'Could not update details.',
      });
    }
    setIsEditDialogOpen(false);
    setSelectedFace(null);
  };

  return (
    <MainLayout title="Known Faces">
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4 text-lg">Loading faces...</p>
          </div>
        ) : knownFaces.length > 0 ? (
          <div className="w-full space-y-4">
            {knownFaces.map((face) => (
                <Card key={face.label} className="w-full">
                    <CardContent className="p-4 flex items-center justify-between">
                       <div className="flex items-center gap-4">
                            <img 
                                src={face.images[0]} 
                                alt={face.label}
                                className="w-20 h-20 object-cover rounded-md"
                            />
                            <div>
                                <p className="font-bold text-xl">{face.label}</p>
                                <p className="text-muted-foreground">{`Class: ${face.class || 'N/A'} | Roll No: ${face.rollNo || 'N/A'}`}</p>
                            </div>
                       </div>
                       <div className="flex gap-2">
                           <Button variant="outline" size="icon" onClick={() => openEditDialog(face)}><Pencil className="h-4 w-4" /></Button>
                           <Button variant="destructive" size="icon" onClick={() => openDeleteDialog(face)}><Trash2 className="h-4 w-4" /></Button>
                       </div>
                    </CardContent>
                </Card>
            ))}
          </div>
        ) : (
          <Alert>
            <AlertTitle>No Known Faces</AlertTitle>
            <AlertDescription>
              No faces have been saved yet. Go to the Add New Student page to enroll faces.
            </AlertDescription>
          </Alert>
        )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={() => setIsDeleteDialogOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
                This action cannot be undone. This will permanently delete the records for {selectedFace?.label}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteFace}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Details Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={() => setIsEditDialogOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Details for {selectedFace?.label}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input id="name" value={editFormData.name} onChange={(e) => setEditFormData({...editFormData, name: e.target.value })} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="class" className="text-right">Class</Label>
                <Input id="class" value={editFormData.class} onChange={(e) => setEditFormData({...editFormData, class: e.target.value })} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="rollNo" className="text-right">Roll No</Label>
                <Input id="rollNo" value={editFormData.rollNo} onChange={(e) => setEditFormData({...editFormData, rollNo: e.target.value })} className="col-span-3" />
              </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEditFace}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </MainLayout>
  );
}

