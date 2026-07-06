import { useEffect, useMemo, useState } from "react"
import { Eye, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@food/components/ui/dialog"
import { Switch } from "@food/components/ui/switch"
import { adminAPI } from "@food/api"
import { toast } from "sonner"

const emptyForm = { name: "", imageUrl: "", description: "", displayOrder: 0, status: true }
const idOf = (item) => item?._id || item?.id
const formatDate = (value) => (value ? new Date(value).toLocaleDateString("en-IN") : "-")

export default function MenuCategories() {
  const [categories, setCategories] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalMode, setModalMode] = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [pendingDelete, setPendingDelete] = useState(null)

  const params = useMemo(() => ({ page: pagination.page, limit: 10, search: search.trim() || undefined, status: status === "all" ? undefined : status }), [pagination.page, search, status])

  const loadCategories = async () => {
    try {
      setLoading(true)
      const response = await adminAPI.getMenuCategories(params)
      const data = response?.data?.data || {}
      setCategories(Array.isArray(data.categories) ? data.categories : [])
      setPagination((prev) => ({ ...prev, ...(data.pagination || {}) }))
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load categories")
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(loadCategories, 250)
    return () => clearTimeout(timer)
  }, [params])

  const openCreate = () => {
    setSelected(null)
    setForm(emptyForm)
    setModalMode("create")
  }

  const openEdit = (category) => {
    setSelected(category)
    setForm({
      name: category?.name || "",
      imageUrl: category?.imageUrl || "",
      description: category?.description || "",
      displayOrder: category?.displayOrder ?? 0,
      status: category?.status !== false,
    })
    setModalMode("edit")
  }

  const saveCategory = async () => {
    if (!form.name.trim()) return toast.error("Category name is required")
    try {
      setSaving(true)
      const body = { ...form, name: form.name.trim(), displayOrder: Number(form.displayOrder) || 0 }
      if (modalMode === "edit" && idOf(selected)) {
        await adminAPI.updateMenuCategory(idOf(selected), body)
        toast.success("Category updated")
      } else {
        await adminAPI.createMenuCategory(body)
        toast.success("Category created")
      }
      setModalMode(null)
      await loadCategories()
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save category")
    } finally {
      setSaving(false)
    }
  }

  const toggleStatus = async (category) => {
    try {
      await adminAPI.updateMenuCategoryStatus(idOf(category), category.status === false)
      toast.success("Category status updated")
      await loadCategories()
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update status")
    }
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    try {
      setSaving(true)
      await adminAPI.deleteMenuCategory(idOf(pendingDelete))
      toast.success("Category deleted")
      setPendingDelete(null)
      await loadCategories()
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to delete category")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 lg:p-6 bg-slate-50 min-h-screen space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Menu categories</h1>
            <div className="text-sm text-slate-500 mt-1">Build the single-kitchen meal category structure.</div>
          </div>
          <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800">
            <Plus className="w-4 h-4" /> Add category
          </button>
        </div>
        <div className="mt-5 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={(e) => { setPagination((p) => ({ ...p, page: 1 })); setSearch(e.target.value) }} placeholder="Search categories..." className="pl-10 pr-4 py-2.5 w-full text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400" />
          </div>
          <select value={status} onChange={(e) => { setPagination((p) => ({ ...p, page: 1 })); setStatus(e.target.value) }} className="px-3 py-2.5 text-sm rounded-lg border border-slate-300 bg-white">
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>{["Category Name", "Total Items", "Status", "Created Date", "Actions"].map((h) => <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? <tr><td colSpan="5" className="px-5 py-10 text-center text-slate-500"><Loader2 className="w-5 h-5 animate-spin inline mr-2" />Loading categories</td></tr> : categories.length ? categories.map((category) => (
                <tr key={idOf(category)} className="hover:bg-slate-50">
                  <td className="px-5 py-4"><div className="flex items-center gap-3"><img src={category.imageUrl || "https://via.placeholder.com/40"} className="w-10 h-10 rounded-lg object-cover border" /><div><div className="font-semibold text-slate-900">{category.name}</div><div className="text-xs text-slate-500 max-w-sm truncate">{category.description || "No description"}</div></div></div></td>
                  <td className="px-5 py-4 text-sm text-slate-700">{category.totalItems || 0}</td>
                  <td className="px-5 py-4"><Switch checked={category.status !== false} onCheckedChange={() => toggleStatus(category)} /></td>
                  <td className="px-5 py-4 text-sm text-slate-600">{formatDate(category.createdAt)}</td>
                  <td className="px-5 py-4"><div className="flex items-center gap-2"><button onClick={() => { setSelected(category); setModalMode("view") }} className="p-2 rounded-lg hover:bg-slate-100"><Eye className="w-4 h-4" /></button><button onClick={() => openEdit(category)} className="p-2 rounded-lg hover:bg-slate-100"><Pencil className="w-4 h-4" /></button><button onClick={() => setPendingDelete(category)} className="p-2 rounded-lg hover:bg-red-50 text-red-600"><Trash2 className="w-4 h-4" /></button></div></td>
                </tr>
              )) : <tr><td colSpan="5" className="px-5 py-12 text-center text-slate-500">No categories found.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 text-sm text-slate-600">
          <span>{pagination.total || 0} categories</span>
          <div className="flex gap-2"><button disabled={pagination.page <= 1} onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))} className="px-3 py-1.5 border rounded-lg disabled:opacity-40">Previous</button><button disabled={pagination.page >= pagination.pages} onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))} className="px-3 py-1.5 border rounded-lg disabled:opacity-40">Next</button></div>
        </div>
      </div>

      <Dialog open={Boolean(modalMode)} onOpenChange={(open) => !open && setModalMode(null)}>
        <DialogContent className="max-w-xl"><DialogHeader><DialogTitle>{modalMode === "view" ? "Category details" : modalMode === "edit" ? "Edit category" : "Add category"}</DialogTitle></DialogHeader>
          {modalMode === "view" ? <div className="space-y-4 text-sm text-slate-700 mt-4"><img src={selected?.imageUrl || "https://via.placeholder.com/600x260"} className="w-full h-48 object-cover rounded-xl border" /><div className="font-semibold text-xl text-slate-900">{selected?.name}</div><div className="text-slate-600">{selected?.description || "No description"}</div><div>Display order: <span className="font-medium text-slate-900">{selected?.displayOrder ?? 0}</span></div></div> : <div className="grid gap-5 mt-4">
            <div><label className="text-sm font-medium text-slate-700 mb-1.5 block">Category name</label><input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="E.g., Breakfast" className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 transition-shadow" /></div>
            <div><label className="text-sm font-medium text-slate-700 mb-1.5 block">Image URL (optional)</label><input value={form.imageUrl} onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))} placeholder="https://..." className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 transition-shadow" /></div>
            <div><label className="text-sm font-medium text-slate-700 mb-1.5 block">Description</label><textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Write a short description..." className="w-full px-4 py-2.5 border border-slate-300 rounded-xl min-h-[100px] focus:outline-none focus:ring-2 focus:ring-slate-900 transition-shadow" /></div>
            <div><label className="text-sm font-medium text-slate-700 mb-1.5 block">Display order</label><input type="number" value={form.displayOrder} onChange={(e) => setForm((f) => ({ ...f, displayOrder: e.target.value }))} placeholder="0" className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 transition-shadow" /></div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 mt-2"><div className="space-y-0.5"><label className="text-sm font-medium text-slate-900">Active status</label><p className="text-xs text-slate-500">Make this category visible in the menu</p></div><Switch checked={form.status} onCheckedChange={(v) => setForm((f) => ({ ...f, status: v }))} /></div>
            <button disabled={saving} onClick={saveCategory} className="w-full mt-2 px-4 py-3 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors disabled:opacity-60">{saving ? "Saving..." : "Save category"}</button>
          </div>}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent className="max-w-md"><DialogHeader><DialogTitle>Delete category</DialogTitle></DialogHeader><p className="text-sm text-slate-600">This category can only be deleted when no items are linked to it.</p><div className="flex justify-end gap-2"><button onClick={() => setPendingDelete(null)} className="px-4 py-2 border rounded-lg">Cancel</button><button disabled={saving} onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg">Delete</button></div></DialogContent>
      </Dialog>
    </div>
  )
}
