import { useState, useMemo, useEffect } from "react"
import { Search, Edit, IndianRupee, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@food/components/ui/dialog"
import { Input } from "@food/components/ui/input"
import { Label } from "@food/components/ui/label"
import { adminAPI } from "@food/api"
import { toast } from "sonner"

export default function DeliveryBoySalary() {
  const [searchQuery, setSearchQuery] = useState("")
  const [partners, setPartners] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedPartner, setSelectedPartner] = useState(null)
  const [salaryForm, setSalaryForm] = useState("")

  const filteredPartners = useMemo(() => {
    if (!searchQuery.trim()) {
      return partners
    }
    const query = searchQuery.toLowerCase().trim()
    return partners.filter(p =>
      p.name?.toLowerCase().includes(query) ||
      p.phone?.toLowerCase().includes(query)
    )
  }, [partners, searchQuery])

  useEffect(() => {
    fetchDeliveryPartners()
  }, [])

  const fetchDeliveryPartners = async () => {
    try {
      setLoading(true)
      const res = await adminAPI.getDeliveryPartners({ limit: 1000 })
      if (res?.data?.success && res?.data?.data?.deliveryPartners) {
        setPartners(res.data.data.deliveryPartners)
      } else {
        setPartners([])
      }
    } catch (error) {
      toast.error('Failed to fetch delivery partners')
      setPartners([])
    } finally {
      setLoading(false)
    }
  }

  const handleEditClick = (partner) => {
    setSelectedPartner(partner)
    setSalaryForm(partner.baseSalary?.toString() || "0")
    setIsEditOpen(true)
  }

  const handleSaveSalary = async () => {
    if (!selectedPartner) return
    const numericSalary = Number(salaryForm)
    if (isNaN(numericSalary) || numericSalary < 0) {
      toast.error("Please enter a valid salary amount")
      return
    }

    try {
      setSaving(true)
      const res = await adminAPI.updateDeliveryBoySalary(selectedPartner._id, numericSalary)
      if (res?.data?.success) {
        toast.success("Salary updated successfully!")
        setIsEditOpen(false)
        fetchDeliveryPartners()
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update salary")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <IndianRupee className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                Delivery Boy Salary
                <span className="bg-gray-100 text-gray-600 text-sm font-medium px-2.5 py-0.5 rounded-full">
                  {partners.length}
                </span>
              </h1>
              <p className="text-sm text-gray-500 mt-1">Manage fixed manual salaries for delivery boys</p>
            </div>
          </div>
        </div>

        <div className="mb-6 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or phone number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#55254b] focus:border-[#55254b] transition-shadow text-sm"
          />
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50/50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 font-semibold w-16">SI</th>
                  <th className="px-6 py-4 font-semibold">Name</th>
                  <th className="px-6 py-4 font-semibold">Phone</th>
                  <th className="px-6 py-4 font-semibold">Current Salary (&#8377;)</th>
                  <th className="px-6 py-4 font-semibold w-24 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#55254b] mb-3" />
                      <p className="text-gray-500">Loading delivery partners...</p>
                    </td>
                  </tr>
                ) : filteredPartners.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                          <Search className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-sm font-medium text-gray-900">No delivery boys found</h3>
                        <p className="text-sm text-gray-500 mt-1">Try adjusting your search</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPartners.map((partner, index) => (
                    <tr key={partner._id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4 text-gray-500">{index + 1}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">{partner.name}</td>
                      <td className="px-6 py-4 text-gray-500">{partner.phone}</td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-green-600">&#8377;{partner.baseSalary || 0}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleEditClick(partner)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors tooltip-trigger"
                          title="Update Salary"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white">
          <DialogHeader>
            <DialogTitle>Update Salary for {selectedPartner?.name}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Monthly Salary (&#8377;)</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="number"
                  value={salaryForm}
                  onChange={(e) => setSalaryForm(e.target.value)}
                  className="pl-9"
                  placeholder="e.g. 15000"
                  min="0"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <button
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              onClick={() => setIsEditOpen(false)}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 text-sm font-medium text-white bg-[#55254b] rounded-lg hover:bg-[#431d3b] flex items-center justify-center min-w-[100px]"
              onClick={handleSaveSalary}
              disabled={saving}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
