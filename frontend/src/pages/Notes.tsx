import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import axios from '../http';
import { Save } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/card'

type Note = { id: number; title: string; content: string }

export default function Notes() {
  const navigate = useNavigate()
  const [notes, setNotes] = useState<Note[]>([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const openNote = (noteId: number) => {
    navigate(`/notes/${noteId}`)
  }

  const loadNotes = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.get(`/notes/`)
      setNotes(response.data.data)
    } catch (err) {
      setError((err as Error).message || 'Unable to load notes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotes()
  }, [])

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      setError('Please enter title and content')
      return
    }

    try {
      setLoading(true)
      await axios.post(`/notes/`, { title, content })
      setTitle('')
      setContent('')
      await loadNotes()
    } catch (err) {
      setError((err as Error).message || 'Unable to add note')
    } finally {
      setLoading(false)
    }
  }

  const deleteNote = async (id: number) => {
    try {
      await axios.delete(`/notes/${id}/`)
      setNotes(prev => prev.filter(n => n.id !== id))
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail)
      } else {
        setError(err.message || 'Unable to delete note')
      }
    }
  }

  return (
    <main className='min-h-screen bg-slate-50 text-slate-900 p-2'>
      <div className='mx-auto max-w-6xl space-y-6'>
        <Card className='bg-white shadow-lg'>
          <CardHeader>
            <CardTitle className='text-2xl'>Notes Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-sm text-slate-500'>Create and manage notes with fast actions and clean UX.</p>
          </CardContent>
        </Card>

        <Card className='bg-white shadow-lg'>
          <CardHeader>
            <CardTitle className='text-xl'>Add New Note</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <input className='w-full p-2 border rounded' value={title} onChange={e => setTitle(e.target.value)} placeholder='Title' />
            <textarea className='w-full p-2 border rounded' value={content} onChange={e => setContent(e.target.value)} placeholder='Content' />
          </CardContent>

          <CardFooter className='flex justify-end p-4 gap-4'>
            <Button variant='outline' onClick={() => { setTitle(''); setContent(''); setError(null); }}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              <Save className='h-4 w-4 mr-2' />
              {loading ? 'Saving…' : 'Submit'}
            </Button>
          </CardFooter>
        </Card>

        {loading && <p>Loading notes...</p>}
        {error && <p className='text-red-500'>{error}</p>}

        <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
          {notes.map(note => (
            <Card key={note.id} className='hover:shadow-xl transition-all duration-200 border border-slate-200'>
              <CardHeader>
                <CardTitle className='text-lg'>{note.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-sm text-slate-600 line-clamp-3'>{note.content}</p>
              </CardContent>
              <CardFooter className='gap-2 justify-between'>
                <Button variant='outline' size='sm' onClick={() => openNote(note.id)}>
                  View
                </Button>
                <Button variant='destructive' size='sm' onClick={() => deleteNote(note.id)}>
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <Outlet />
      </div>
    </main>
  )
}