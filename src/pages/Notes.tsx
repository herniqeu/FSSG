import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { format } from 'date-fns';
import { Plus, ArrowDown, HelpCircle, FileText, Trash2, Edit2 } from 'lucide-react';
import { KeyboardShortcuts } from '../components/KeyboardShortcuts';
import { KEYBOARD_SHORTCUTS, getOS } from '../lib/utils';
import { Dialog } from '../components/ui/dialog';

interface Note {
  id: string;
  title: string;
  content: string[];
  date: Date;
}

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentLine, setCurrentLine] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [editingLineIndex, setEditingLineIndex] = useState<number | null>(null);
  const [editingLineContent, setEditingLineContent] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [isFileDialogOpen, setIsFileDialogOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteTitle, setEditingNoteTitle] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const os = getOS();
  const shortcuts = KEYBOARD_SHORTCUTS[os === 'mac' ? 'MAC' : 'WINDOWS'];

  useLayoutEffect(() => {
    setIsReady(true);
    return () => setIsReady(false);
  }, []);

  // Fetch notes when component mounts
  useEffect(() => {
    function fetchNotes() {
      try {
        const savedNotes = localStorage.getItem('notes');
        if (savedNotes) {
          const parsedNotes = JSON.parse(savedNotes).map((note: any) => ({
            ...note,
            date: new Date(note.date)
          }));
          setNotes(parsedNotes);
          setCurrentNote(parsedNotes[0]);
        } else {
          // Create a default note if none exist
          const defaultNote = {
            id: crypto.randomUUID(),
            title: 'Add a title',
            content: [],
            date: new Date()
          };
          setNotes([defaultNote]);
          setCurrentNote(defaultNote);
          localStorage.setItem('notes', JSON.stringify([defaultNote]));
        }
      } catch (error) {
        console.error('Error fetching notes:', error);
        // Set default note on error
        const defaultNote = {
          id: crypto.randomUUID(),
          title: 'Add a title',
          content: [],
          date: new Date()
        };
        setNotes([defaultNote]);
        setCurrentNote(defaultNote);
      } finally {
        setIsLoading(false);
      }
    }

    fetchNotes();
  }, []);

  // Save notes to localStorage whenever they change
  useEffect(() => {
    if (notes.length > 0) {
      localStorage.setItem('notes', JSON.stringify(notes));
    }
  }, [notes]);

  const createNote = (note: Note) => {
    setNotes(prevNotes => [note, ...prevNotes]);
  };

  const updateNote = (note: Note) => {
    setNotes(prevNotes => 
      prevNotes.map(n => n.id === note.id ? note : n)
    );
  };

  const deleteNote = (noteId: string) => {
    setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
    if (currentNote?.id === noteId) {
      setCurrentNote(notes[0] || null);
    }
  };

  const isNearBottom = () => {
    if (containerRef.current) {
      const container = containerRef.current;
      const threshold = 100;
      return container.scrollHeight - container.scrollTop - container.clientHeight <= threshold;
    }
    return false;
  };

  const handleScroll = () => {
    if (containerRef.current) {
      const isNotAtBottom = !isNearBottom();
      setShowScrollButton(isNotAtBottom);
    }
  };

  const smoothScrollTo = (element: HTMLElement, to: number, duration: number) => {
    const start = element.scrollTop;
    const change = to - start;
    const startTime = performance.now();

    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easeInOutCubic = (t: number) => 
        t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      element.scrollTop = start + change * easeInOutCubic(progress);

      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      }
    };

    requestAnimationFrame(animateScroll);
  };

  const scrollToBottom = () => {
    if (containerRef.current) {
      smoothScrollTo(
        containerRef.current,
        containerRef.current.scrollHeight,
        1000
      );
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      const wasNearBottom = isNearBottom();
      
      if (currentLine.trim()) {
        setCurrentNote(prev => {
          const newContent = [...prev!.content];
          if (newContent.length === 0) {
            newContent.push(currentLine);
          } else {
            newContent[newContent.length - 1] += ' ' + currentLine;
          }
          const updatedNote: Note = {
            ...prev!,
            content: newContent
          };
          // Update the note in the database
          updateNote(updatedNote);
          return updatedNote;
        });

        setNotes(prev => prev.map(note => 
          note.id === currentNote!.id 
            ? { ...note, content: [...note.content, currentLine] }
            : note
        ));

        setCurrentLine('');
      } else {
        setCurrentNote(prev => {
          const updatedNote: Note = {
            ...prev!,
            content: [...prev!.content, ' ']
          };
          // Update the note in the database
          updateNote(updatedNote);
          return updatedNote;
        });

        setNotes(prev => prev.map(note => 
          note.id === currentNote!.id 
            ? { ...note, content: [...note.content, ' '] }
            : note
        ));

        setCurrentLine('');
      }

      if (wasNearBottom && containerRef.current) {
        requestAnimationFrame(() => {
          smoothScrollTo(
            containerRef.current!,
            containerRef.current!.scrollHeight,
            1000
          );
        });
      }
    }
  };

  const handleFilesClick = () => {
    setIsFileDialogOpen(true);
  };

  const handleNewNote = () => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: 'Add a title',
      content: [],
      date: new Date()
    };
    
    createNote(newNote);
    setCurrentNote(newNote);
    setCurrentLine('');
    setIsInputFocused(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const updateTitle = (newTitle: string) => {
    const updatedNote: Note = {
      ...currentNote!,
      title: newTitle
    };
    setCurrentNote(updatedNote);
    setNotes(prev => 
      prev.map(note => 
        note.id === currentNote!.id ? updatedNote : note
      )
    );
    updateNote(updatedNote);
  };

  const handleLineClick = (index: number) => {
    if (!currentNote) return;
    setEditingLineIndex(index);
    setEditingLineContent(currentNote.content[index]);
  };

  const handleEditKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (editingLineIndex !== null && currentNote) {
        const updatedNote: Note = {
          ...currentNote,
          content: currentNote.content.map((line, i) => 
            i === editingLineIndex ? editingLineContent : line
          )
        };
        setCurrentNote(updatedNote);
        updateNote(updatedNote);
        setEditingLineIndex(null);
        setEditingLineContent('');
      }
    } else if (e.key === 'Escape') {
      setEditingLineIndex(null);
      setEditingLineContent('');
    }
  };

  const handlePageClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (inputRef.current && !target.closest('input')) {
      inputRef.current.focus();
    }
  };

  const updateNoteTitle = (noteId: string, newTitle: string) => {
    if (newTitle.trim() === '') return; // Don't allow empty titles
    setNotes(prev => 
      prev.map(note => 
        note.id === noteId ? { ...note, title: newTitle } : note
      )
    );
    if (currentNote?.id === noteId) {
      setCurrentNote(prev => ({ ...prev!, title: newTitle }));
    }
    setEditingNoteId(null);
    setEditingNoteTitle('');
  };

  const startEditingNote = (note: Note) => {
    setEditingNoteId(note.id);
    setEditingNoteTitle(note.title);
  };

  const cancelEditingNote = () => {
    setEditingNoteId(null);
    setEditingNoteTitle('');
  };

  const switchToNote = (note: Note) => {
    // Save current note's content before switching
    setNotes(prev => prev.map(n => 
      n.id === currentNote?.id ? currentNote : n
    ));
    
    setCurrentNote(note);
    setCurrentLine('');
    setIsFileDialogOpen(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <>
      <div className="h-full flex flex-col overflow-hidden" onClick={handlePageClick}>
        <KeyboardShortcuts 
          onCreateNote={handleNewNote}
          onEditTitle={() => {
            const titleInput = document.querySelector('input[type="text"][value="' + currentNote?.title + '"]');
            if (titleInput instanceof HTMLInputElement) {
              titleInput.focus();
            }
          }}
        />

        {/* Help tooltip */}
        <div
          className="absolute top-4 right-4 flex flex-col items-end z-50"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <div className="cursor-pointer bg-white/20 hover:bg-white/30 transition-all duration-200 rounded-full w-8 h-8 flex items-center justify-center backdrop-blur-sm ring-1 ring-white/25">
            <HelpCircle className="w-4 h-4 text-[#363332]/70" />
          </div>
          <div className={`absolute top-full right-0 transition-all duration-300 ease-out ${showTooltip ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1 pointer-events-none'}`}>
            <div className="w-72 mt-3 p-4 bg-white/95 text-[#363332]/90 rounded-lg shadow-lg text-sm backdrop-blur-sm ring-1 ring-black/5">
              <h3 className="font-medium mb-2 text-[#363332]">Shortcuts</h3>
              <ul className="space-y-2">
                <li className="flex justify-between items-center">
                  <span className="text-[#363332]/80">Previous page</span>
                  <kbd className="px-2 py-1 bg-[#F5F2EA] rounded text-xs text-[#363332]/70">
                    {shortcuts.NAVIGATION.DISPLAY.LEFT}
                  </kbd>
                </li>
                <li className="flex justify-between items-center">
                  <span className="text-[#363332]/80">Next page</span>
                  <kbd className="px-2 py-1 bg-[#F5F2EA] rounded text-xs text-[#363332]/70">
                    {shortcuts.NAVIGATION.DISPLAY.RIGHT}
                  </kbd>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex-1 relative">
          <div 
            ref={containerRef}
            className="writing-container px-16 py-12 absolute inset-0 overflow-y-auto overflow-x-hidden"
            onScroll={handleScroll}
          >
            <div className="text-content mb-[40vh]">
              {currentNote?.content.map((line, index) => (
                <div key={index} className="relative">
                  {editingLineIndex === index ? (
                    <input
                      ref={editInputRef}
                      type="text"
                      value={editingLineContent}
                      onChange={(e) => setEditingLineContent(e.target.value)}
                      onKeyDown={handleEditKeyPress}
                      className="text-line text-gray-600 text-2xl mb-3 min-h-[1.5em] w-full bg-transparent border-none outline-none"
                      autoFocus
                    />
                  ) : (
                    <p 
                      onClick={() => handleLineClick(index)}
                      className="text-line text-gray-600 text-2xl mb-3 min-h-[1.5em] cursor-text"
                    >
                      {line}
                    </p>
                  )}
                </div>
              )) || (
                <div className="text-gray-400 text-2xl">
                  Start writing to create your first note...
                </div>
              )}
            </div>
          </div>
          
          {showScrollButton && (
            <button
              onClick={scrollToBottom}
              className="fixed top-1/2 -translate-y-1/2 right-8 text-gray-600 hover:text-gray-800 transition-colors z-50"
              aria-label="Scroll to bottom"
            >
              <span className="flex items-center gap-1">
                <ArrowDown size={16} />
                <span className="text-xs">SCROLL</span>
              </span>
            </button>
          )}
          
          <div className="fixed left-0 right-0 top-[40vh] px-16 pointer-events-none">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={currentLine}
                onChange={(e) => setCurrentLine(e.target.value)}
                onKeyPress={handleKeyPress}
                onFocus={() => setIsInputFocused(true)}
                className="text-6xl bg-transparent border-none outline-none w-full pointer-events-auto py-8"
                placeholder={!isInputFocused ? "Start writing..." : ""}
                autoFocus
              />
            </div>
          </div>
        </div>
        
        <div className="h-20 px-16 flex items-center justify-between bg-[#F5F2EA]">
          <div>
            <input
              type="text"
              value={currentNote?.title ?? ''}
              onChange={(e) => updateTitle(e.target.value)}
              className="text-xl bg-transparent border-none outline-none text-[#363332]"
              placeholder="Add a title"
            />
            <p className="text-sm text-[#A8A8A6] mt-1">
              {currentNote ? format(currentNote.date, 'MMMM d, yyyy').toUpperCase() : format(new Date(), 'MMMM d, yyyy').toUpperCase()}
            </p>
          </div>
          
          <div className="flex items-center gap-8">
            <button
              onClick={handleNewNote}
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              <span className="flex items-center gap-1">
                <Plus size={20} />
                <span className="text-sm">NEW</span>
              </span>
            </button>

            <button
              onClick={handleFilesClick}
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              <span className="flex items-center gap-1">
                <FileText size={20} />
                <span className="text-sm">FILES</span>
              </span>
            </button>
          </div>
        </div>

        <Dialog
          isOpen={isFileDialogOpen}
          onClose={() => setIsFileDialogOpen(false)}
          className="max-w-xl"
        >
          <div className="space-y-6">
            <h2 className="text-2xl font-medium text-[#363332]">Your Notes</h2>
            <div className="space-y-2">
              {notes.map(note => (
                <div
                  key={note.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-white/50 hover:bg-white/80 transition-colors border border-[#363332]/10"
                >
                  {editingNoteId === note.id ? (
                    <input
                      type="text"
                      value={editingNoteTitle}
                      onChange={(e) => setEditingNoteTitle(e.target.value)}
                      onBlur={() => {
                        if (editingNoteTitle.trim() !== '') {
                          updateNoteTitle(note.id, editingNoteTitle);
                        } else {
                          cancelEditingNote();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && editingNoteTitle.trim() !== '') {
                          updateNoteTitle(note.id, editingNoteTitle);
                        } else if (e.key === 'Escape') {
                          cancelEditingNote();
                        }
                      }}
                      className="flex-1 bg-transparent border-none outline-none text-[#363332]"
                      autoFocus
                    />
                  ) : (
                    <div className="flex-1">
                      <h3 className="text-[#363332] font-medium">{note.title}</h3>
                      <p className="text-sm text-[#A8A8A6]">
                        {format(note.date, 'MMMM d, yyyy')}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startEditingNote(note)}
                      className="p-2 text-[#363332]/60 hover:text-[#363332] transition-colors rounded-full hover:bg-white/50"
                    >
                      <Edit2 size={16} />
                    </button>
                    {notes.length > 1 && (
                      <button
                        onClick={() => deleteNote(note.id)}
                        className="p-2 text-[#363332]/60 hover:text-red-500 transition-colors rounded-full hover:bg-white/50"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                    {note.id !== currentNote?.id && (
                      <button
                        onClick={() => switchToNote(note)}
                        className="px-3 py-1 text-sm text-[#363332] bg-white/50 hover:bg-white transition-colors rounded-full"
                      >
                        Open
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Dialog>
      </div>
    </>
  );
} 