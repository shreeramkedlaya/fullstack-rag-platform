import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from '../http';
import { Button } from '../components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/card'

type Note = { id: number; title: string; content: string }

export default function NoteDetail() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [note, setNote] = useState<Note | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    axios
      .get(`/notes/${id}/`)
      .then(res => setNote(res.data))
      .catch(err => setError((err as Error).message || 'Unable to load note'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <p className='p-5 text-center text-slate-500'>Loading...</p>
  if (error) return <p className='p-5 text-center text-red-600'>{error}</p>
  if (!note) return <p className='p-5 text-center text-slate-600'>No note found</p>

  return (
    <div className='p-5'>
      <Card className='bg-white shadow-lg border border-slate-200'>
        <CardHeader>
          <CardTitle className='text-2xl'>{note.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-slate-700'>{note.content}</p>
        </CardContent>
        <CardFooter className='justify-end'>
          <Button variant='outline' onClick={() => navigate(-1)}>
            Back
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
