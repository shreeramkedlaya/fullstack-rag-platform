import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from '../../http';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { ArrowLeft, Save, ShoppingBag, Calendar } from 'lucide-react'

type Order = {
  id: number
  customer: number
  item_name: string
  description: string
  due_date: string
  amount: number
  advanced_paid: number
  balance: number
}

type Customer = {
  id: number
  name: string
  phone: string
  address: string
  orders: Order[]
}

export default function CustomerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Order Form State
  const [itemName, setItemName] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [amount, setAmount] = useState<number | ''>('')
  const [advancedPaid, setAdvancedPaid] = useState<number | ''>(0)

  const fetchCustomer = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`/customers/${id}/`)
      setCustomer(response.data)
    } catch (err) {
      setError((err as Error).message || 'Failed to fetch customer details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchCustomer()
    }
  }, [id])

  const handleCreateOrder = async () => {
    if (!itemName || !dueDate || amount === '') {
      setError('Item name, due date, and amount are required')
      return
    }

    try {
      setLoading(true)
      await axios.post(`/customers/orders/`, {
        customer: parseInt(id as string),
        item_name: itemName,
        description,
        due_date: dueDate,
        amount: Number(amount),
        advanced_paid: Number(advancedPaid)
      })
      // Reset form
      setItemName('')
      setDescription('')
      setDueDate('')
      setAmount('')
      setAdvancedPaid(0)

      // Refresh customer data to show new order
      await fetchCustomer()
    } catch (err) {
      setError((err as Error).message || 'Failed to create order')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteOrder = async (orderId: number) => {
    if (!confirm('Are you sure you want to delete this order?')) return
    try {
      await axios.delete(`/customers/orders/${orderId}/`)
      await fetchCustomer()
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail)
      } else {
        setError(err.message || 'Failed to delete order')
      }
    }
  }

  if (loading && !customer) {
    return <div className="text-center py-10 text-slate-500">Loading customer profile...</div>
  }

  if (!customer) {
    return <div className="text-center py-10 text-red-500">{error || 'Customer not found'}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4 mb-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/customers')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Customers
        </Button>
      </div>

      <Card className="bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-xl border-none">
        <CardContent className="pt-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">{customer.name}</h1>
              <div className="text-slate-300 space-y-1">
                <p>Phone: {customer.phone}</p>
                <p>Address: {customer.address}</p>
              </div>
            </div>
            <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm text-center">
              <p className="text-sm text-slate-300 uppercase tracking-wider font-semibold">Total Orders</p>
              <p className="text-4xl font-bold mt-1">{customer.orders.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Add New Order</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <input
              className="p-2 border rounded-md"
              placeholder="Item Name"
              value={itemName}
              onChange={e => setItemName(e.target.value)}
            />
            <input
              type="date"
              className="p-2 border rounded-md"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
            />
            <input
              type="number"
              className="p-2 border rounded-md"
              placeholder="Total Amount ($)"
              value={amount}
              onChange={e => setAmount(Number(e.target.value))}
            />
            <input
              type="number"
              className="p-2 border rounded-md"
              placeholder="Advanced Paid ($)"
              value={advancedPaid}
              onChange={e => setAdvancedPaid(Number(e.target.value))}
            />
            <textarea
              className="p-2 border rounded-md md:col-span-2"
              placeholder="Description / Notes"
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </CardContent>
        <CardFooter className="flex justify-end gap-2 bg-slate-50 py-3 rounded-b-xl">
          <Button onClick={handleCreateOrder} disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Creating...' : 'Create Order'}
          </Button>
        </CardFooter>
      </Card>

      <h2 className="text-xl font-bold mt-8 mb-4 px-1 flex items-center text-slate-800">
        <ShoppingBag className="w-5 h-5 mr-2 text-indigo-500" />
        Order History
      </h2>

      {customer.orders.length === 0 ? (
        <div className="text-center py-10 text-slate-500 bg-white rounded-lg border border-dashed border-slate-300">
          No orders found for this customer.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {customer.orders.map(order => (
            <Card key={order.id} className="border-slate-200">
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-lg font-semibold">{order.item_name}</CardTitle>
                <div className={`px-2 py-1 rounded-full text-xs font-semibold ${order.balance > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                  {order.balance > 0 ? 'Balance Due' : 'Paid in Full'}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-slate-600 line-clamp-2">{order.description || 'No description provided.'}</p>

                <div className="grid grid-cols-2 gap-2 text-sm bg-slate-50 p-3 rounded-md">
                  <div>
                    <span className="text-slate-500 text-xs block uppercase">Total Amount</span>
                    <span className="font-semibold">${order.amount}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs block uppercase">Advanced Paid</span>
                    <span className="font-semibold text-emerald-600">${order.advanced_paid}</span>
                  </div>
                  <div className="col-span-2 pt-2 mt-1 border-t border-slate-200">
                    <span className="text-slate-500 text-xs block uppercase">Remaining Balance</span>
                    <span className={`font-bold text-lg ${order.balance > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                      ${order.balance}
                    </span>
                  </div>
                </div>

                <div className="flex items-center text-xs text-slate-500 mt-2">
                  <Calendar className="w-3 h-3 mr-1" />
                  Due: {new Date(order.due_date).toLocaleDateString()}
                </div>
              </CardContent>
              <CardFooter className="flex justify-end pt-0 pb-3 pr-3">
                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteOrder(order.id)}>
                  Delete Order
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
