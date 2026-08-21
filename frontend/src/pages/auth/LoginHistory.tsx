import { useState, useEffect } from 'react'
import axios from '../../http';
import { Button } from '../../components/ui/button'
import { Shield, Monitor, ServerCrash, CheckCircle2, XCircle, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { DataTable, type Column } from '../../components/ui/DataTable'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../components/ui/alert-dialog"

type LogEntry = {
  id: number;
  email: string;
  ip_address: string;
  status: string;
  user_agent: string;
  date: string;
}

type Pagination = {
  total: number;
  offset: number;
  limit: number;
  has_more: boolean;
}

export default function LoginHistory() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const limit = 15;

  const fetchLogs = async (offset = 0) => {
    try {
      setLoading(true)
      const res = await axios.get(`/auth/login-history/?offset=${offset}&limit=${limit}`)
      setLogs(res.data.history)
      setPagination(res.data.pagination)
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch audit logs.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs(0)
  }, [])

  const handlePurge = async () => {
    try {
      setLoading(true)
      await axios.delete(`/auth/login-history/`)
      fetchLogs(0)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to purge logs.')
      setLoading(false)
    }
  }

  const handleDeleteLog = async (log: LogEntry) => {
    try {
      setLoading(true)
      await axios.delete(`/auth/login-history/?id=${log.id}`)
      fetchLogs(pagination?.offset || 0)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete log.')
      setLoading(false)
    }
  }

  const columns: Column<LogEntry>[] = [
    {
      header: 'Timestamp',
      accessor: (row) => new Date(row.date).toLocaleString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      }),
      sortKey: 'date',
      sortable: true,
      className: 'whitespace-nowrap text-slate-500'
    },
    {
      header: 'User Email',
      accessor: 'email',
      sortable: true,
      className: 'font-medium text-slate-900'
    },
    {
      header: 'IP Address',
      accessor: (row) => (
        <div className="flex items-center gap-1 font-mono text-xs text-slate-500">
          <Monitor className="w-3 h-3" />
          {row.ip_address}
        </div>
      )
    },
    {
      header: 'Status',
      accessor: (row) => {
        const isSuccess = row.status === 'Success';
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${isSuccess
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-red-50 text-red-700 border-red-200'
            }`}>
            {isSuccess ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
            {row.status}
          </span>
        )
      }
    },
    {
      header: 'Device / Browser',
      accessor: (row) => (
        <span className="text-xs text-slate-500 truncate max-w-xs block" title={row.user_agent}>
          {row.user_agent.length > 50 ? row.user_agent.substring(0, 50) + '...' : row.user_agent}
        </span>
      )
    }
  ];

  const renderHeader = () => (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Shield className="w-8 h-8 text-indigo-600" />
          Security Audit Log
        </h1>
        <p className="text-slate-500 mt-1">Monitor all authentication attempts across the platform.</p>
      </div>
    </div>
  );

  const renderClearHistoryButton = () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          className="flex items-center gap-2"
          disabled={loading || logs.length === 0}
        >
          <Trash2 className="w-4 h-4" />
          Clear History
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete ALL login history logs from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handlePurge} className="bg-red-600 hover:bg-red-700 focus:ring-red-600">
            Yes, purge history
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  const renderPagination = () => {
    if (!pagination || pagination.total === 0) return null;
    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
        <span className="text-sm text-slate-500">
          Showing <span className="font-medium text-slate-900">{pagination.offset + 1}</span> to <span className="font-medium text-slate-900">{Math.min(pagination.offset + pagination.limit, pagination.total)}</span> of <span className="font-medium text-slate-900">{pagination.total}</span> entries
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLogs(pagination.offset - limit)}
            disabled={pagination.offset === 0 || loading}
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLogs(pagination.offset + limit)}
            disabled={!pagination.has_more || loading}
          >
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      {renderHeader()}

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md border border-red-200 flex items-center gap-2">
          <ServerCrash className="w-5 h-5" />
          {error}
        </div>
      )}

      <DataTable
        data={logs}
        columns={columns}
        enableSearch={true}
        searchPlaceholder="Search audit logs..."
        defaultView="table"
        emptyMessage={loading ? "Loading audit logs..." : "No login attempts recorded yet."}
        extraToolbarActions={renderClearHistoryButton()}
        onDelete={handleDeleteLog}
      />

      {renderPagination()}
    </div>
  )
}
