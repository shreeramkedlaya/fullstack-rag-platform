import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/card'
import { Button } from './ui/button'
import { User, Phone, MapPin } from 'lucide-react'

type Customer = {
  id: number
  name: string
  phone: string
  address: string
}

interface CustomerCardProps {
  customer: Customer
  onClick: (customer: Customer) => void
  onEdit: (customer: Customer) => void
  onDelete: (id: number) => void
}

export default function CustomerCard({ customer, onClick, onEdit, onDelete }: CustomerCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col" onClick={() => onClick(customer)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-lg">
          <User className="w-5 h-5 mr-2 text-slate-400" />
          {customer.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-slate-600 flex-1">
        <div className="flex items-center">
          <Phone className="w-4 h-4 mr-2 text-slate-400" />
          {customer.phone}
        </div>
        <div className="flex items-start">
          <MapPin className="w-4 h-4 mr-2 text-slate-400 mt-1 flex-shrink-0" />
          <span className="line-clamp-2">{customer.address}</span>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end pt-2 gap-2 mt-auto">
        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); onEdit(customer) }}>
          Edit
        </Button>
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={(e) => { 
            e.stopPropagation() 
            onDelete(customer.id) 
          }}>
          Delete
        </Button>
      </CardFooter>
    </Card>
  )
}
