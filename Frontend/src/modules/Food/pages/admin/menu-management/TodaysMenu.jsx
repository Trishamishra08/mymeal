import { useEffect, useMemo, useState } from "react"
import { CalendarDays, CheckCircle2, Copy, Loader2, Save, Trash2 } from "lucide-react"
import { adminAPI } from "@food/api"
import { toast } from "sonner"
import { Switch } from "@food/components/ui/switch"

const idOf = (item) => item?._id || item?.id
const tomorrowKey = () => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10) }
const groupByCategory = (items, categories) => categories.map((category) => ({ category, items: items.filter((item) => String(idOf(item.categoryId) || item.categoryId) === String(idOf(category))) })).filter((row) => row.items.length)

export default function TodaysMenu() {
  const [menuDate, setMenuDate] = useState(tomorrowKey())
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [history, setHistory] = useState([])
  const [stats, setStats] = useState({})
  const [selectedItems, setSelectedItems] = useState({})
  const [defaultItems, setDefaultItems] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const grouped = useMemo(() => groupByCategory(items, categories), [items, categories])
  const configuredCount = Object.values(defaultItems).filter(Boolean).length
  const requiredCount = grouped.length

  const applyMenu = (menu) => {
    const nextSelected = {}
    const nextDefault = {}
    ;(menu?.selectedItems || []).forEach((row) => { nextSelected[String(row.categoryId)] = (row.itemIds || []).map(String) })
    ;(menu?.defaultItems || []).forEach((row) => { nextDefault[String(row.categoryId)] = String(row.itemId) })
    setSelectedItems(nextSelected)
    setDefaultItems(nextDefault)
  }

  const loadData = async () => {
    try {
      setLoading(true)
      const [catsRes, itemsRes, menuRes, historyRes, statsRes] = await Promise.all([
        adminAPI.getMenuCategories({ limit: 100, status: "active" }),
        adminAPI.getMenuItems({ limit: 500, status: "active", availability: "available" }),
        adminAPI.getTodayMenu({ date: menuDate }),
        adminAPI.getMenuHistory({ limit: 8 }),
        adminAPI.getMenuStats(),
      ])
      setCategories(catsRes?.data?.data?.categories || [])
      setItems(itemsRes?.data?.data?.items || [])
      setHistory(historyRes?.data?.data?.menus || [])
      setStats(statsRes?.data?.data || {})
      applyMenu(menuRes?.data?.data?.menu || null)
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load menu data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [menuDate])

  const toggleItem = (categoryId, itemId) => {
    setSelectedItems((prev) => {
      const key = String(categoryId)
      const current = new Set(prev[key] || [])
      current.has(String(itemId)) ? current.delete(String(itemId)) : current.add(String(itemId))
      const next = { ...prev, [key]: [...current] }
      if (!current.has(String(defaultItems[key]))) setDefaultItems((d) => ({ ...d, [key]: "" }))
      return next
    })
  }

  const saveMenu = async () => {
    try {
      setSaving(true)
      await adminAPI.saveTodayMenu({
        menuDate,
        selectedItems: Object.entries(selectedItems).map(([categoryId, itemIds]) => ({ categoryId, itemIds })),
        defaultItems: Object.entries(defaultItems).filter(([, itemId]) => itemId).map(([categoryId, itemId]) => ({ categoryId, itemId })),
      })
      toast.success("Daily menu saved")
      await loadData()
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save daily menu")
    } finally {
      setSaving(false)
    }
  }

  const duplicateYesterday = async () => {
    try {
      const response = await adminAPI.duplicateYesterdayMenu({ date: menuDate })
      applyMenu(response?.data?.data || null)
      toast.success("Yesterday's menu loaded")
    } catch (error) {
      toast.error(error?.response?.data?.message || "No menu found for yesterday")
    }
  }

  const deleteMenu = async (menu) => {
    if (!window.confirm("Delete this daily menu?")) return
    try {
      await adminAPI.deleteTodayMenu(idOf(menu) || menu.menuDate)
      toast.success("Menu deleted")
      await loadData()
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to delete menu")
    }
  }

  // previewDefaults logic moved directly into the render to use grouped and defaultItems

  return (
    <div className="p-4 lg:p-6 bg-slate-50 min-h-screen space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div><h1 className="text-2xl font-bold text-slate-900">Today's menu</h1><div className="text-sm text-slate-500 mt-1">Create the daily default meal and available customization choices.</div></div>
          <div className="flex flex-col sm:flex-row gap-2"><input type="date" value={menuDate} onChange={(e) => setMenuDate(e.target.value)} className="px-3 py-2.5 border rounded-lg bg-white" /><button onClick={duplicateYesterday} className="inline-flex items-center gap-2 px-4 py-2.5 border rounded-lg bg-white text-sm font-semibold"><Copy className="w-4 h-4" /> Duplicate yesterday</button><button disabled={saving || loading} onClick={saveMenu} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-semibold disabled:opacity-60"><Save className="w-4 h-4" /> {saving ? "Saving..." : "Save menu"}</button></div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
          <Stat label="Active categories" value={stats.activeCategories || 0} />
          <Stat label="Active items" value={stats.activeItems || 0} />
          <Stat label="Tomorrow ready" value={stats.tomorrowMenuReady ? "Yes" : "No"} />
          <Stat label="Defaults selected" value={`${configuredCount}/${requiredCount}`} />
        </div>
      </div>

      {loading ? <div className="bg-white rounded-xl border p-12 text-center text-slate-500"><Loader2 className="w-5 h-5 animate-spin inline mr-2" />Loading menu</div> : (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
          <div className="space-y-4">
            {grouped.length ? grouped.map(({ category, items: categoryItems }) => {
              const key = String(idOf(category))
              const selected = selectedItems[key] || []
              return <div key={key} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5"><div className="flex items-center justify-between gap-3 mb-4"><div><h2 className="font-bold text-slate-900">{category.name}</h2><div className="text-xs text-slate-500">{selected.length} selected</div></div><select value={defaultItems[key] || ""} onChange={(e) => setDefaultItems((prev) => ({ ...prev, [key]: e.target.value }))} className="px-3 py-2 border rounded-lg text-sm bg-white"><option value="">Default item</option>{categoryItems.filter((item) => selected.includes(String(idOf(item)))).map((item) => <option key={idOf(item)} value={idOf(item)}>{item.name}</option>)}</select></div><div className="grid grid-cols-1 md:grid-cols-2 gap-3">{categoryItems.map((item) => <label key={idOf(item)} className={`flex gap-3 p-3 border rounded-lg cursor-pointer ${selected.includes(String(idOf(item))) ? "border-slate-900 bg-slate-50" : "border-slate-200"}`}><input type="checkbox" checked={selected.includes(String(idOf(item)))} onChange={() => toggleItem(key, idOf(item))} className="mt-1" /><img src={item.imageUrl || "https://via.placeholder.com/48"} className="w-12 h-12 rounded-lg object-cover border" /><span className="min-w-0"><span className="block font-semibold text-sm text-slate-900 truncate">{item.name}</span><span className="block text-xs text-slate-500">{item.defaultQuantity || "1 portion"}</span></span></label>)}</div></div>
            }) : <div className="bg-white rounded-xl border p-12 text-center text-slate-500">Add active categories and items to build a daily menu.</div>}
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 sticky top-4"><div className="flex items-center gap-2 mb-4"><CheckCircle2 className="w-5 h-5 text-emerald-600" /><h2 className="font-bold text-slate-900">Default meal preview</h2></div><div className="space-y-3">{grouped.map((row) => {
              const key = String(idOf(row.category));
              const isIncluded = defaultItems.hasOwnProperty(key);
              const item = row.items.find((item) => String(idOf(item)) === String(defaultItems[key]));
              return <div key={key} className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <Switch checked={isIncluded} onCheckedChange={(checked) => {
                  setDefaultItems(prev => {
                    const next = { ...prev };
                    if (checked) next[key] = "";
                    else delete next[key];
                    return next;
                  });
                }} />
                <div><div className="text-xs uppercase text-slate-500">{row.category.name}</div>
                {isIncluded ? <div className="font-semibold text-sm text-slate-900">{item?.name || "Please select an item"}</div> : <div className="text-sm text-slate-400 italic">Excluded</div>}
                </div></div>
            })}</div></div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"><div className="px-5 py-4 border-b flex items-center gap-2"><CalendarDays className="w-5 h-5" /><h2 className="font-bold text-slate-900">Menu history</h2></div><div className="overflow-x-auto"><table className="w-full"><thead className="bg-slate-50"><tr>{["Date", "Categories", "Default meal", "Actions"].map((h) => <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{history.length ? history.map((menu) => <tr key={idOf(menu) || menu.menuDate}><td className="px-5 py-4 text-sm font-semibold">{menu.menuDate}</td><td className="px-5 py-4 text-sm">{menu.snapshot?.length || 0}</td><td className="px-5 py-4 text-sm text-slate-600">{(menu.snapshot || []).map((row) => row.defaultItem?.itemName).filter(Boolean).join(", ") || "-"}</td><td className="px-5 py-4"><div className="flex gap-2"><button onClick={() => { setMenuDate(menu.menuDate); applyMenu(menu) }} className="px-3 py-1.5 border rounded-lg text-sm">Edit</button><button onClick={() => deleteMenu(menu)} className="p-2 rounded-lg hover:bg-red-50 text-red-600"><Trash2 className="w-4 h-4" /></button></div></td></tr>) : <tr><td colSpan="4" className="px-5 py-10 text-center text-slate-500">No menu history yet.</td></tr>}</tbody></table></div></div>
    </div>
  )
}

function Stat({ label, value }) {
  return <div className="rounded-lg border border-slate-200 bg-slate-50 p-4"><div className="text-xs font-semibold uppercase text-slate-500">{label}</div><div className="mt-1 text-xl font-bold text-slate-900">{value}</div></div>
}
