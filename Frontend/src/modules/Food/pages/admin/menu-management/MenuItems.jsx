import { useEffect, useMemo, useState } from "react"
import { Eye, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@food/components/ui/dialog"
import { Switch } from "@food/components/ui/switch"
import { adminAPI } from "@food/api"
import { toast } from "sonner"

const emptyForm = { name: "", categoryId: "", imageUrl: "", description: "", defaultQuantity: "1 portion", availability: true, status: true }
const idOf = (item) => item?._id || item?.id
const categoryName = (item) => item?.categoryId?.name || item?.category?.name || "-"

export default function MenuItems() {
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [search, setSearch] = useState("")
  const [categoryId, setCategoryId] = useState("all")
  const [status, setStatus] = useState("all")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalMode, setModalMode] = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [pendingDelete, setPendingDelete] = useState(null)

  const params = useMemo(() => ({ page: pagination.page, limit: 10, search: search.trim() || undefined, categoryId: categoryId === "all" ? undefined : categoryId, status: status === "all" ? undefined : status }), [pagination.page, search, categoryId, status])

  const loadItems = async () => {
    try {
      setLoading(true)
      const [itemsRes, catsRes] = await Promise.all([adminAPI.getMenuItems(params), adminAPI.getMenuCategories({ limit: 100, status: "active" })])
      const itemsData = itemsRes?.data?.data || {}
      setItems(Array.isArray(itemsData.items) ? itemsData.items : [])
      setPagination((prev) => ({ ...prev, ...(itemsData.pagination || {}) }))
      setCategories(catsRes?.data?.data?.categories || [])
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load menu items")
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(loadItems, 250)
    return () => clearTimeout(timer)
  }, [params])

  const openCreate = () => {
    setSelected(null)
    setForm({ ...emptyForm, categoryId: categories[0]?._id || "" })
    setModalMode("create")
  }

  const openEdit = (item) => {
    setSelected(item)
    setForm({
      name: item?.name || "",
      categoryId: idOf(item?.categoryId) || item?.categoryId || "",
      imageUrl: item?.imageUrl || "",
      description: item?.description || "",
      defaultQuantity: item?.defaultQuantity || "1 portion",
      availability: item?.availability !== false,
      status: item?.status !== false,
    })
    setModalMode("edit")
  }

  const saveItem = async () => {
    if (!form.name.trim()) return toast.error("Item name is required")
    if (!form.categoryId) return toast.error("Category is required")
    try {
      setSaving(true)
      const body = { ...form, name: form.name.trim() }
      if (modalMode === "edit" && idOf(selected)) {
        await adminAPI.updateMenuItem(idOf(selected), body)
        toast.success("Item updated")
      } else {
        await adminAPI.createMenuItem(body)
        toast.success("Item created")
      }
      setModalMode(null)
      await loadItems()
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save item")
    } finally {
      setSaving(false)
    }
  }

  const toggleStatus = async (item) => {
    try {
      await adminAPI.updateMenuItemStatus(idOf(item), item.status === false)
      toast.success("Item status updated")
      await loadItems()
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update status")
    }
  }

  const toggleAvailability = async (item) => {
    try {
      await adminAPI.updateMenuItemAvailability(idOf(item), item.availability === false)
      toast.success("Availability updated")
      await loadItems()
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update availability")
    }
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    try {
      setSaving(true)
      await adminAPI.deleteMenuItem(idOf(pendingDelete))
      toast.success("Item deleted")
      setPendingDelete(null)
      await loadItems()
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to delete item")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 lg:p-6 bg-slate-50 min-h-screen space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div><h1 className="text-2xl font-bold text-slate-900">Menu items</h1><div className="text-sm text-slate-500 mt-1">Maintain the reusable MyMeal item library.</div></div>
          <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800"><Plus className="w-4 h-4" /> Add item</button>
        </div>
        <div className="mt-5 grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative md:col-span-2"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input value={search} onChange={(e) => { setPagination((p) => ({ ...p, page: 1 })); setSearch(e.target.value) }} placeholder="Search items..." className="pl-10 pr-4 py-2.5 w-full text-sm rounded-lg border border-slate-300" /></div>
          <select value={categoryId} onChange={(e) => { setPagination((p) => ({ ...p, page: 1 })); setCategoryId(e.target.value) }} className="px-3 py-2.5 text-sm rounded-lg border border-slate-300 bg-white"><option value="all">All categories</option>{categories.map((cat) => <option key={idOf(cat)} value={idOf(cat)}>{cat.name}</option>)}</select>
          <select value={status} onChange={(e) => { setPagination((p) => ({ ...p, page: 1 })); setStatus(e.target.value) }} className="px-3 py-2.5 text-sm rounded-lg border border-slate-300 bg-white"><option value="all">All status</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"><div className="overflow-x-auto"><table className="w-full"><thead className="bg-slate-50 border-b border-slate-200"><tr>{["Item", "Category", "Available", "Status", "Actions"].map((h) => <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">
        {loading ? <tr><td colSpan="5" className="px-5 py-10 text-center text-slate-500"><Loader2 className="w-5 h-5 animate-spin inline mr-2" />Loading items</td></tr> : items.length ? items.map((item) => <tr key={idOf(item)} className="hover:bg-slate-50"><td className="px-5 py-4"><div className="flex items-center gap-3"><img src={item.imageUrl || "https://via.placeholder.com/40"} className="w-10 h-10 rounded-lg object-cover border" /><div><div className="font-semibold text-slate-900">{item.name}</div><div className="text-xs text-slate-500">{item.defaultQuantity || "1 portion"}</div></div></div></td><td className="px-5 py-4 text-sm">{categoryName(item)}</td><td className="px-5 py-4"><Switch checked={item.availability !== false} onCheckedChange={() => toggleAvailability(item)} /></td><td className="px-5 py-4"><Switch checked={item.status !== false} onCheckedChange={() => toggleStatus(item)} /></td><td className="px-5 py-4"><div className="flex items-center gap-2"><button onClick={() => { setSelected(item); setModalMode("view") }} className="p-2 rounded-lg hover:bg-slate-100"><Eye className="w-4 h-4" /></button><button onClick={() => openEdit(item)} className="p-2 rounded-lg hover:bg-slate-100"><Pencil className="w-4 h-4" /></button><button onClick={() => setPendingDelete(item)} className="p-2 rounded-lg hover:bg-red-50 text-red-600"><Trash2 className="w-4 h-4" /></button></div></td></tr>) : <tr><td colSpan="5" className="px-5 py-12 text-center text-slate-500">No menu items found.</td></tr>}
      </tbody></table></div><div className="flex items-center justify-between px-5 py-4 border-t text-sm text-slate-600"><span>{pagination.total || 0} items</span><div className="flex gap-2"><button disabled={pagination.page <= 1} onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))} className="px-3 py-1.5 border rounded-lg disabled:opacity-40">Previous</button><button disabled={pagination.page >= pagination.pages} onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))} className="px-3 py-1.5 border rounded-lg disabled:opacity-40">Next</button></div></div></div>

      <Dialog open={Boolean(modalMode)} onOpenChange={(open) => !open && setModalMode(null)}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>{modalMode === "view" ? "Item details" : modalMode === "edit" ? "Edit item" : "Add item"}</DialogTitle></DialogHeader>{modalMode === "view" ? <div className="space-y-4 text-sm text-slate-700 mt-4"><img src={selected?.imageUrl || "https://via.placeholder.com/640x260"} className="w-full h-48 object-cover rounded-xl border" /><div className="font-semibold text-xl text-slate-900">{selected?.name}</div><div className="text-slate-600">{selected?.description || "No description"}</div><div className="grid grid-cols-2 gap-4 mt-2"><div>Category: <span className="font-medium text-slate-900">{categoryName(selected)}</span></div></div></div> : <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
        <div><label className="text-sm font-medium text-slate-700 mb-1.5 block">Item name</label><input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="E.g., Paneer Curry" className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 transition-shadow" /></div>
        <div><label className="text-sm font-medium text-slate-700 mb-1.5 block">Category</label><select value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition-shadow"><option value="">Select category</option>{categories.map((cat) => <option key={idOf(cat)} value={idOf(cat)}>{cat.name}</option>)}</select></div>
        <div className="md:col-span-2"><label className="text-sm font-medium text-slate-700 mb-1.5 block">Image URL (optional)</label><input value={form.imageUrl} onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))} placeholder="https://..." className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 transition-shadow" /></div>
        <div className="md:col-span-2"><label className="text-sm font-medium text-slate-700 mb-1.5 block">Default quantity</label><input value={form.defaultQuantity} onChange={(e) => setForm((f) => ({ ...f, defaultQuantity: e.target.value }))} placeholder="1 portion" className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 transition-shadow" /></div>
        <div className="md:col-span-2"><label className="text-sm font-medium text-slate-700 mb-1.5 block">Description</label><textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Write a short description..." className="w-full px-4 py-2.5 border border-slate-300 rounded-xl min-h-[100px] focus:outline-none focus:ring-2 focus:ring-slate-900 transition-shadow" /></div>
        
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100"><div className="space-y-0.5"><label className="text-sm font-medium text-slate-900">Available</label><p className="text-xs text-slate-500">Currently in stock</p></div><Switch checked={form.availability} onCheckedChange={(v) => setForm((f) => ({ ...f, availability: v }))} /></div>
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100"><div className="space-y-0.5"><label className="text-sm font-medium text-slate-900">Active status</label><p className="text-xs text-slate-500">Visible on menu</p></div><Switch checked={form.status} onCheckedChange={(v) => setForm((f) => ({ ...f, status: v }))} /></div>

        <button disabled={saving} onClick={saveItem} className="md:col-span-2 mt-2 w-full px-4 py-3 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors disabled:opacity-60">{saving ? "Saving..." : "Save item"}</button>
      </div>}</DialogContent></Dialog>

      <Dialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && setPendingDelete(null)}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>Delete item</DialogTitle></DialogHeader><p className="text-sm text-slate-600">Historical daily menus keep their saved snapshot after deletion.</p><div className="flex justify-end gap-2"><button onClick={() => setPendingDelete(null)} className="px-4 py-2 border rounded-lg">Cancel</button><button disabled={saving} onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg">Delete</button></div></DialogContent></Dialog>
    </div>
  )
}
