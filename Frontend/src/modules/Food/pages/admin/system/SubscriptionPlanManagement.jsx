import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Copy,
  Loader2,
  Pencil,
  Plus,
  Power,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import api from "@food/api";
import { getModuleToken } from "@food/utils/auth";

const planTypes = ["Weekly", "Monthly", "Custom"];
const mealTypes = ["Breakfast", "Lunch", "Dinner", "Lunch + Dinner"];
const statusOptions = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];
const pageSize = 6;

const emptyForm = {
  id: "",
  title: "",
  planType: "Weekly",
  durationDays: "",
  price: "",
  mealType: "Lunch",
  dailyTiffinQuantity: "1",
  deliveryFrom: "",
  deliveryTo: "",
  allowMealCustomization: true,
  customizationCutoffTime: "",
  allowSkipDelivery: true,
  allowAddOnTiffin: true,
  isActive: true,
  sortOrder: "0",
  description: "",
};

const getPlanId = (plan) => plan?._id || plan?.id || "";
const formatPrice = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;
const getDeliveryText = (plan) => {
  const from = plan?.deliveryTime?.from || plan?.deliveryFrom || "";
  const to = plan?.deliveryTime?.to || plan?.deliveryTo || "";
  return from && to ? `${from} - ${to}` : "Not set";
};

const buildFormFromPlan = (plan, duplicate = false) => ({
  id: duplicate ? "" : getPlanId(plan),
  title: duplicate ? `${plan.title || "Plan"} Copy` : plan.title || "",
  planType: plan.planType || "Weekly",
  durationDays: plan.durationDays || "",
  price: plan.price || "",
  mealType: plan.mealType || "Lunch",
  dailyTiffinQuantity: plan.dailyTiffinQuantity || "1",
  deliveryFrom: plan.deliveryTime?.from || "",
  deliveryTo: plan.deliveryTime?.to || "",
  allowMealCustomization: Boolean(plan.allowMealCustomization),
  customizationCutoffTime: plan.customizationCutoffTime || "",
  allowSkipDelivery: Boolean(plan.allowSkipDelivery),
  allowAddOnTiffin: Boolean(plan.allowAddOnTiffin),
  isActive: plan.isActive !== false,
  sortOrder: plan.order ?? plan.sortOrder ?? "0",
  description: plan.description || "",
});

const validateForm = (form, plans) => {
  const errors = {};
  const name = form.title.trim();
  if (!name) errors.title = "Plan name is required";
  if (Number(form.durationDays) <= 0) errors.durationDays = "Duration must be greater than 0";
  if (Number(form.price) <= 0) errors.price = "Price must be greater than 0";
  if (!form.mealType) errors.mealType = "Meal type is required";
  if (!form.deliveryFrom || !form.deliveryTo) errors.deliveryTime = "Delivery time is required";
  const duplicate = plans.some((plan) => {
    if (getPlanId(plan) === form.id) return false;
    return String(plan.title || "").trim().toLowerCase() === name.toLowerCase();
  });
  if (duplicate) errors.title = "Duplicate plan names are not allowed";
  return errors;
};

function ToggleField({ label, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm font-bold ${checked ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-500"}`}
    >
      <span>{label}</span>
      <span className={`h-5 w-9 rounded-full p-0.5 transition ${checked ? "bg-emerald-500" : "bg-slate-300"}`}>
        <span className={`block h-4 w-4 rounded-full bg-white transition ${checked ? "translate-x-4" : "translate-x-0"}`} />
      </span>
    </button>
  );
}

export default function SubscriptionPlanManagement() {
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const isEditing = Boolean(form.id);

  const authConfig = useMemo(() => {
    const token = getModuleToken("admin");
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  }, []);

  const formErrors = useMemo(() => validateForm(form, plans), [form, plans]);
  const canSave = Object.keys(formErrors).length === 0;

  const loadPlans = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/food/subscription-plans", {
        ...authConfig,
        params: { search: search.trim() || undefined, status: statusFilter },
      });
      setPlans(response?.data?.data?.plans || []);
      setPage(1);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load subscription plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(loadPlans, 250);
    return () => window.clearTimeout(timer);
  }, [search, statusFilter]);

  const resetForm = () => setForm(emptyForm);

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const editPlan = (plan) => setForm(buildFormFromPlan(plan));

  const duplicatePlan = (plan) => {
    setForm(buildFormFromPlan(plan, true));
    toast.info("Plan copied. Review the name and save it.");
  };

  const savePlan = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!canSave) {
      const firstError = Object.values(formErrors)[0] || "Please fix the highlighted fields";
      setError(firstError);
      toast.error(firstError);
      return;
    }

    setSaving(true);
    const payload = {
      title: form.title.trim(),
      planType: form.planType,
      durationDays: Number(form.durationDays),
      price: Number(form.price),
      mealType: form.mealType,
      dailyTiffinQuantity: Number(form.dailyTiffinQuantity || 1),
      deliveryTime: {
        from: form.deliveryFrom,
        to: form.deliveryTo,
      },
      allowMealCustomization: form.allowMealCustomization,
      customizationCutoffTime: form.allowMealCustomization ? form.customizationCutoffTime : "",
      allowSkipDelivery: form.allowSkipDelivery,
      allowAddOnTiffin: form.allowAddOnTiffin,
      isActive: form.isActive,
      sortOrder: Number(form.sortOrder || 0),
      description: form.description,
    };

    try {
      if (isEditing) {
        await api.patch(`/food/subscription-plans/${form.id}`, payload, authConfig);
      } else {
        await api.post("/food/subscription-plans", payload, authConfig);
      }
      const successMessage = isEditing ? "Subscription plan updated" : "Subscription plan added";
      setMessage(successMessage);
      toast.success(successMessage);
      resetForm();
      await loadPlans();
    } catch (err) {
      const nextError = err?.response?.data?.message || "Failed to save subscription plan";
      setError(nextError);
      toast.error(nextError);
    } finally {
      setSaving(false);
    }
  };

  const deletePlan = async (plan) => {
    const id = getPlanId(plan);
    if (!id || !window.confirm(`Delete ${plan.title}?`)) return;
    try {
      await api.delete(`/food/subscription-plans/${id}`, authConfig);
      setMessage("Subscription plan deleted");
      toast.success("Subscription plan deleted");
      await loadPlans();
    } catch (err) {
      const nextError = err?.response?.data?.message || "Failed to delete subscription plan";
      setError(nextError);
      toast.error(nextError);
    }
  };

  const togglePlan = async (plan) => {
    const id = getPlanId(plan);
    if (!id) return;
    try {
      await api.patch(`/food/subscription-plans/${id}/status`, {}, authConfig);
      toast.success(plan.isActive ? "Plan deactivated" : "Plan activated");
      await loadPlans();
    } catch (err) {
      const nextError = err?.response?.data?.message || "Failed to update status";
      setError(nextError);
      toast.error(nextError);
    }
  };

  const paginatedPlans = useMemo(() => {
    const start = (page - 1) * pageSize;
    return plans.slice(start, start + pageSize);
  }, [page, plans]);
  const totalPages = Math.max(1, Math.ceil(plans.length / pageSize));

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Subscription Plan Management</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage MyMeal tiffin subscription plans shown to customers.
        </p>
      </div>

      {message && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <form onSubmit={savePlan} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              {isEditing ? "Edit Plan" : "Add Plan"}
            </h2>
            {isEditing && (
              <button type="button" onClick={resetForm} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600">
                <X className="h-4 w-4" />
                Cancel
              </button>
            )}
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Plan Name *</span>
              <input
                value={form.title}
                onChange={(event) => setField("title", event.target.value)}
                placeholder="Monthly Lunch Plan"
                className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#ef2b24] ${formErrors.title ? "border-red-200" : "border-slate-200"}`}
                required
              />
              {formErrors.title && <span className="mt-1 block text-xs font-semibold text-red-500">{formErrors.title}</span>}
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-sm font-bold text-slate-700">Plan Type</span>
                <select value={form.planType} onChange={(event) => setField("planType", event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#ef2b24]">
                  {planTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-700">Duration (Days) *</span>
                <input type="number" min="1" value={form.durationDays} onChange={(event) => setField("durationDays", event.target.value)} placeholder="30" className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#ef2b24] ${formErrors.durationDays ? "border-red-200" : "border-slate-200"}`} required />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-sm font-bold text-slate-700">Price (₹) *</span>
                <input type="number" min="1" value={form.price} onChange={(event) => setField("price", event.target.value)} placeholder="3499" className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#ef2b24] ${formErrors.price ? "border-red-200" : "border-slate-200"}`} required />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-700">Display Order</span>
                <input type="number" value={form.sortOrder} onChange={(event) => setField("sortOrder", event.target.value)} placeholder="0" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#ef2b24]" />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-sm font-bold text-slate-700">Meal Type *</span>
                <select value={form.mealType} onChange={(event) => setField("mealType", event.target.value)} className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#ef2b24] ${formErrors.mealType ? "border-red-200" : "border-slate-200"}`} required>
                  {mealTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-700">Daily Tiffin Quantity</span>
                <input type="number" min="1" value={form.dailyTiffinQuantity} onChange={(event) => setField("dailyTiffinQuantity", event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#ef2b24]" />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-sm font-bold text-slate-700">Delivery From *</span>
                <input type="time" value={form.deliveryFrom} onChange={(event) => setField("deliveryFrom", event.target.value)} className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#ef2b24] ${formErrors.deliveryTime ? "border-red-200" : "border-slate-200"}`} required />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-700">Delivery To *</span>
                <input type="time" value={form.deliveryTo} onChange={(event) => setField("deliveryTo", event.target.value)} className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#ef2b24] ${formErrors.deliveryTime ? "border-red-200" : "border-slate-200"}`} required />
              </label>
            </div>

            <div className="space-y-2">
              <ToggleField label="Allow Meal Customization" checked={form.allowMealCustomization} onChange={(value) => setField("allowMealCustomization", value)} />
              {form.allowMealCustomization && (
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">Customization Cutoff Time</span>
                  <input type="time" value={form.customizationCutoffTime} onChange={(event) => setField("customizationCutoffTime", event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#ef2b24]" />
                </label>
              )}
              <ToggleField label="Allow Skip Delivery" checked={form.allowSkipDelivery} onChange={(value) => setField("allowSkipDelivery", value)} />
              <ToggleField label="Allow Add-On Tiffin" checked={form.allowAddOnTiffin} onChange={(value) => setField("allowAddOnTiffin", value)} />
              <ToggleField label="Active / Inactive" checked={form.isActive} onChange={(value) => setField("isActive", value)} />
            </div>

            <label className="block">
              <span className="text-sm font-bold text-slate-700">Description</span>
              <textarea value={form.description} onChange={(event) => setField("description", event.target.value)} placeholder="Monthly lunch tiffin plan for regular customers." rows={3} className="mt-1 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#ef2b24]" />
            </label>
          </div>

          <button type="submit" disabled={saving || !canSave} className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#ef2b24] text-sm font-bold text-white disabled:opacity-60">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : isEditing ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {isEditing ? "Save Plan" : "Add Plan"}
          </button>
        </form>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Configured Plans</h2>
              <span className="mt-1 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                {plans.length} item(s)
              </span>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search plans" className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-[#ef2b24] sm:w-56" />
              </label>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 outline-none focus:border-[#ef2b24]">
                {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="h-64 animate-pulse rounded-xl border border-red-100 bg-slate-50" />
              ))}
            </div>
          ) : plans.length === 0 ? (
            <div className="flex h-52 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 text-slate-400">
              <CalendarDays className="mb-2 h-8 w-8" />
              No subscription plans found
            </div>
          ) : (
            <>
              <div className="grid gap-4 xl:grid-cols-2">
                {paginatedPlans.map((plan) => (
                  <article key={getPlanId(plan)} className="rounded-xl border border-red-100 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-2xl font-black text-slate-950">{plan.title}</h3>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <p className="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-black uppercase tracking-wider text-[#ef2b24]">
                            {Number(plan.durationDays || 0)} days
                          </p>
                          <p className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-wider text-slate-600">
                            {plan.planType || "Weekly"}
                          </p>
                        </div>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${plan.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {plan.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-lg bg-slate-50 p-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Price</p>
                        <p className="mt-1 font-black text-slate-900">{formatPrice(plan.price)}</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Meal Type</p>
                        <p className="mt-1 font-black text-slate-900">{plan.mealType || "-"}</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Quantity</p>
                        <p className="mt-1 font-black text-slate-900">{Number(plan.dailyTiffinQuantity || 1)} tiffin/day</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Delivery</p>
                        <p className="mt-1 font-black text-slate-900">{getDeliveryText(plan)}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                      {plan.allowMealCustomization && <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-[#ef2b24]">Customization</span>}
                      {plan.allowSkipDelivery && <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-[#ef2b24]">Skip</span>}
                      {plan.allowAddOnTiffin && <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-[#ef2b24]">Add-On</span>}
                      {!plan.allowMealCustomization && !plan.allowSkipDelivery && !plan.allowAddOnTiffin && <span className="text-sm font-semibold text-slate-400">No optional features enabled</span>}
                    </div>

                    {plan.description && <p className="mt-3 text-sm text-slate-500">{plan.description}</p>}

                    <div className="mt-4 flex items-center justify-end gap-2">
                      <button type="button" title="Edit" onClick={() => editPlan(plan)} className="rounded-lg border border-slate-200 p-2 text-slate-600"><Pencil className="h-4 w-4" /></button>
                      <button type="button" title="Duplicate" onClick={() => duplicatePlan(plan)} className="rounded-lg border border-slate-200 p-2 text-slate-600"><Copy className="h-4 w-4" /></button>
                      <button type="button" title={plan.isActive ? "Deactivate" : "Activate"} onClick={() => togglePlan(plan)} className={`rounded-lg border p-2 ${plan.isActive ? "border-emerald-100 text-emerald-600" : "border-slate-200 text-slate-400"}`}><Power className="h-4 w-4" /></button>
                      <button type="button" title="Delete" onClick={() => deletePlan(plan)} className="rounded-lg border border-red-100 p-2 text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </article>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-bold text-slate-600">
                <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1} className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-50">Previous</button>
                <span>Page {page} of {totalPages}</span>
                <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages} className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-50">Next</button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

