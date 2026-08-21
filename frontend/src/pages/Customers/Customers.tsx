import axios from '../../http';
import { MapPin, Phone, User, X, Plus, Save, Trash } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CustomerCard from '../../components/CustomerCard'
import { Button } from '../../components/ui/button'
import { DataTable, type Column } from '../../components/ui/DataTable'

type Customer = {
  id: number
  name: string
  phone: string
  address: string
}

export default function Customers() {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Selection State
  const [selectedCustomers, setSelectedCustomers] = useState<Customer[]>([])

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCustomerId, setEditingCustomerId] = useState<number | null>(null)

  // Form State
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`/customers/`)
      setCustomers(response.data)
    } catch (err) {
      setError((err as Error).message || 'Failed to fetch customers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim() || !address.trim()) {
      setError('Please fill out all fields')
      return
    }

    setLoading(true)
    setError(null)
    try {
      if (editingCustomerId) {
        await axios.put(`/customers/${editingCustomerId}/`, { name, phone, address })
      } else {
        await axios.post(`/customers/`, { name, phone, address })
      }
      closeModal()
      await fetchCustomers()
    } catch (err) {
      setError((err as Error).message || `Failed to ${editingCustomerId ? 'update' : 'create'} customer`)
    } finally {
      setLoading(false)
    }
  }

  const openModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomerId(customer.id)
      setName(customer.name)
      setPhone(customer.phone)
      setAddress(customer.address)
    } else {
      setEditingCustomerId(null)
      setName('')
      setPhone('')
      setAddress('')
    }
    setError(null)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingCustomerId(null)
    setName('')
    setPhone('')
    setAddress('')
    setError(null)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this customer?')) return

    try {
      await axios.delete(`/customers/${id}/`)
      setCustomers(prev => prev.filter(c => c.id !== id))
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail)
      } else {
        setError(err.message || 'Failed to delete customer')
      }
    }
  }

  const handleBulkDelete = async () => {
    if (selectedCustomers.length === 0) return
    if (!confirm(`Are you sure you want to delete ${selectedCustomers.length} customers?`)) return

    try {
      setLoading(true)
      setError(null)
      // Execute a single batched HTTP request
      const idsToDelete = selectedCustomers.map(c => c.id)
      await axios.post(`/customers/bulk-delete/`, { ids: idsToDelete })

      // Update local state
      const selectedIds = new Set(selectedCustomers.map(c => c.id))
      setCustomers(prev => prev.filter(c => !selectedIds.has(c.id)))
      setSelectedCustomers([]) // clear selection
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail)
      } else {
        setError(err.message || 'Failed to delete selected customers')
      }
    } finally {
      setLoading(false)
    }
  }

  // Define Columns for DataTable
  const columns: Column<Customer>[] = [
    {
      header: 'Name',
      sortable: true,
      accessor: 'name'
    },
    {
      header: 'Phone',
      sortable: true,
      accessor: 'phone'
    },
    {
      header: 'Address',
      sortable: true,
      accessor: 'address'
    }
  ]

  // We override the cell rendering to keep the icons using the original object rendering logic inside the row.
  const styledColumns: Column<Customer>[] = columns.map(col => {
    if (col.header === 'Name') {
      return {
        ...col, accessor: (row) => (
          <div className="flex items-center font-medium text-slate-900">
            <User className="w-4 h-4 mr-2 text-slate-400" />
            {row.name}
          </div>
        )
      }
    }
    if (col.header === 'Phone') {
      return {
        ...col, accessor: (row) => (
          <div className="flex items-center text-slate-600">
            <Phone className="w-4 h-4 mr-2 text-slate-400" />
            {row.phone}
          </div>
        )
      }
    }
    if (col.header === 'Address') {
      return {
        ...col, accessor: (row) => (
          <div className="flex items-center text-slate-600">
            <MapPin className="w-4 h-4 mr-2 text-slate-400 flex-shrink-0" />
            <span className="truncate max-w-[200px] sm:max-w-xs">{row.address}</span>
          </div>
        )
      }
    }
    return col;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Customers Management</h1>
        <p className="text-slate-500">View and manage your customer database.</p>
      </div>

      <DataTable
        data={customers}
        columns={styledColumns}
        allowToggle={true}
        enableSearch={true}
        enableSelection={true}
        onSelectionChange={(selected) => setSelectedCustomers(selected)}
        searchPlaceholder="Search customers..."
        defaultView="table"
        onRowClick={(row) => navigate(`/customers/${row.id}`)}
        onEdit={(row) => openModal(row)}
        onDelete={(row) => handleDelete(row.id)}
        emptyMessage={
          !loading && customers.length === 0
            ? "No customers found. Add some to get started."
            : loading ? "Loading customers..." : "No matching results."
        }
        extraToolbarActions={
          <div className="flex items-center gap-2">
            {selectedCustomers.length > 0 && (
              <Button onClick={handleBulkDelete} variant="destructive" className="flex items-center gap-1.5 shadow-sm">
                <Trash className="w-4 h-4" />
                <span className="hidden sm:inline">Delete Selected ({selectedCustomers.length})</span>
              </Button>
            )}
            <Button onClick={() => openModal()} className="flex items-center gap-1.5 bg-slate-900 text-white hover:bg-slate-800 shadow-sm">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Customer</span>
            </Button>
          </div>
        }
        renderCard={(customer) => (
          <CustomerCard
            customer={customer}
            onClick={(c) => navigate(`/customers/${c.id}`)}
            onEdit={(c) => openModal(c)}
            onDelete={(id) => handleDelete(id)}
          />
        )}
      />

      {/* Add/Edit Customer Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="flex justify-between items-center p-6 border-b border-slate-100/60">
              <h2 className="text-xl font-semibold text-slate-800 tracking-tight">
                {editingCustomerId ? 'Edit Customer' : 'Add New Customer'}
              </h2>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
                <input
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-colors placeholder:text-slate-400 text-slate-900 shadow-sm"
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone Number</label>
                <input
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-colors placeholder:text-slate-400 text-slate-900 shadow-sm"
                  placeholder="e.g. (555) 123-4567"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Address</label>
                <input
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-colors placeholder:text-slate-400 text-slate-900 shadow-sm"
                  placeholder="e.g. 123 Main St, City, Country"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm font-medium rounded-md border border-red-100">
                  {error}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-6 bg-white border-t border-slate-50">
              <Button variant="outline" onClick={closeModal} className="font-medium shadow-sm">Cancel</Button>
              <Button onClick={handleSubmit} disabled={loading} className="bg-slate-900 hover:bg-slate-800 text-white shadow-sm font-medium">
                {loading ? 'Saving...' : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {editingCustomerId ? 'Update Customer' : 'Save Customer'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
