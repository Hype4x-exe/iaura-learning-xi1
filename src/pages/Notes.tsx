import { useEffect, useState, useCallback, useMemo, memo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FileText, Loader2, Edit2, Save, X, Maximize2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Note = {
  id: string;
  title: string;
  content: string;
  key_points: any;
  created_at: string;
};

const Notes = memo(() => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { user } = useAuth();

  const fetchNotes = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error("Error fetching notes:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleEdit = useCallback((note: Note) => {
    setEditingId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditTitle("");
    setEditContent("");
  }, []);

  const handleSave = useCallback(async (noteId: string) => {
    if (!editTitle.trim() || !editContent.trim()) {
      toast.error("Title and content cannot be empty");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("notes")
        .update({
          title: editTitle,
          content: editContent,
        })
        .eq("id", noteId);

      if (error) throw error;

      setNotes(notes.map(note => 
        note.id === noteId 
          ? { ...note, title: editTitle, content: editContent }
          : note
      ));
      
      toast.success("Note updated successfully!");
      handleCancelEdit();
    } catch (error) {
      console.error("Error updating note:", error);
      toast.error("Failed to update note");
    } finally {
      setSaving(false);
    }
  }, [editTitle, editContent, notes]);

  const handleViewNote = useCallback((note: Note) => {
    setSelectedNote(note);
    setIsDialogOpen(true);
  }, []);

  const handleDeleteClick = useCallback((noteId: string) => {
    setNoteToDelete(noteId);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!noteToDelete) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from("notes")
        .delete()
        .eq("id", noteToDelete);

      if (error) throw error;

      setNotes(notes.filter(note => note.id !== noteToDelete));
      toast.success("Note deleted successfully!");
      setDeleteDialogOpen(false);
      setNoteToDelete(null);
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error("Failed to delete note");
    } finally {
      setDeleting(false);
    }
  }, [noteToDelete, notes]);

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen liquid-bg p-4 pb-24">
      <header className="pt-8 pb-6 text-center fade-in-up">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-neon bg-clip-text text-transparent">Study Notes</h1>
        <p className="text-muted-foreground text-sm">
          AI-generated notes from your materials
        </p>
      </header>

      <div className="max-w-md mx-auto space-y-4">
        {notes.length === 0 ? (
          <Card className="glass-strong p-12 text-center shadow-float border-white/40">
            <div className="relative inline-block mb-4">
              <FileText className="w-16 h-16 text-muted-foreground/50" />
              <div className="absolute inset-0 blur-2xl bg-primary/10" />
            </div>
            <p className="text-sm text-muted-foreground">
              No notes yet. Upload materials to generate notes!
            </p>
          </Card>
        ) : (
          notes.map((note, idx) => (
            <Card
              key={note.id}
              className="glass-strong p-6 shadow-glass fade-in-up hover:shadow-glow hover:-translate-y-1 transition-all duration-500 border-white/40 group cursor-pointer"
              style={{ animationDelay: `${idx * 0.1}s` }}
              onClick={() => editingId !== note.id && handleViewNote(note)}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-[14px] bg-gradient-neon flex items-center justify-center flex-shrink-0 shadow-neon">
                    <FileText className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div className="absolute inset-0 rounded-[14px] bg-gradient-neon opacity-20 blur-lg group-hover:opacity-40 transition-opacity" />
                </div>
                <div className="flex-1 min-w-0">
                  {editingId === note.id ? (
                    <div className="space-y-3">
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="font-bold text-lg"
                        placeholder="Note title"
                      />
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="min-h-[120px] text-sm"
                        placeholder="Note content"
                      />
                    </div>
                  ) : (
                    <>
                      <h3 className="font-bold mb-2 text-lg">{note.title}</h3>
                      <p className="text-sm text-foreground/70 line-clamp-3 mb-3 leading-relaxed">
                        {note.content}
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs text-primary hover:text-primary/80 p-0 h-auto"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewNote(note);
                        }}
                      >
                        <Maximize2 className="w-3 h-3 mr-1" /> View Full Note
                      </Button>
                    </>
                  )}
                </div>
              </div>
              
              {note.key_points && note.key_points.length > 0 && (
                <div className="glass rounded-[16px] p-4 mb-3 border border-white/30">
                  <p className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider">Key Points</p>
                  <ul className="space-y-2">
                    {note.key_points.slice(0, 3).map((point, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="flex items-center justify-between pt-3 border-t border-white/20">
                <span className="text-xs text-muted-foreground font-medium">{formatDate(note.created_at)}</span>
                {editingId === note.id ? (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleSave(note.id)}
                      disabled={saving}
                      className="bg-primary hover:bg-primary/90"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <><Save className="w-4 h-4 mr-1" /> Save</>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={saving}
                    >
                      <X className="w-4 h-4 mr-1" /> Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(note);
                      }}
                      className="hover:bg-primary/10"
                    >
                      <Edit2 className="w-4 h-4 mr-1" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(note.id);
                      }}
                      className="hover:bg-destructive/10 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedNote && (
            <>
              <DialogHeader className="pr-14">
                <DialogTitle className="text-2xl font-bold">{selectedNote.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 mt-4">
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">Content</h4>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{selectedNote.content}</p>
                </div>
                
                {selectedNote.key_points && selectedNote.key_points.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-3">Key Points</h4>
                    <ul className="space-y-2">
                      {selectedNote.key_points.map((point, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <span className="text-primary mt-0.5 font-bold">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    Created: {formatDate(selectedNote.created_at)}
                  </p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this note?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your note
              from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
});

Notes.displayName = 'Notes';

export default Notes;
