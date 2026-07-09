import { useState, useEffect } from "react"
import { Save, Loader2, DollarSign, Package } from "lucide-react"
import { adminAPI } from "@food/api"
import { toast } from "sonner"

export default function FeeSettings() {
  const [feeSettings, setFeeSettings] = useState({
    singleOrderTiffinAmount: "",
    singleOrderGst: "",
    singleOrderDeliveryFee: "",
    subscriptionDeliveryFee: "",
    subscriptionGst: "",
    subscriptionAddonTiffinCharge: "",
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const fetchFeeSettings = async () => {
    try {
      setLoading(true)
      const response = await adminAPI.getFeeSettings()
      if (response.data.success && response.data.data.feeSettings) {
        const saved = response.data.data.feeSettings;
        setFeeSettings({
          singleOrderTiffinAmount: saved.singleOrderTiffinAmount ?? "",
          singleOrderGst: saved.singleOrderGst ?? "",
          singleOrderDeliveryFee: saved.singleOrderDeliveryFee ?? "",
          subscriptionDeliveryFee: saved.subscriptionDeliveryFee ?? "",
          subscriptionGst: saved.subscriptionGst ?? "",
          subscriptionAddonTiffinCharge: saved.subscriptionAddonTiffinCharge ?? "",
        })
      }
    } catch (error) {
      toast.error('Failed to load fee settings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFeeSettings()
  }, [])

  const handleSave = async () => {
    try {
      setSaving(true)
      const payload = {
        singleOrderTiffinAmount: feeSettings.singleOrderTiffinAmount === "" ? undefined : Number(feeSettings.singleOrderTiffinAmount),
        singleOrderGst: feeSettings.singleOrderGst === "" ? undefined : Number(feeSettings.singleOrderGst),
        singleOrderDeliveryFee: feeSettings.singleOrderDeliveryFee === "" ? undefined : Number(feeSettings.singleOrderDeliveryFee),
        subscriptionDeliveryFee: feeSettings.subscriptionDeliveryFee === "" ? undefined : Number(feeSettings.subscriptionDeliveryFee),
        subscriptionGst: feeSettings.subscriptionGst === "" ? undefined : Number(feeSettings.subscriptionGst),
        subscriptionAddonTiffinCharge: feeSettings.subscriptionAddonTiffinCharge === "" ? undefined : Number(feeSettings.subscriptionAddonTiffinCharge),
        isActive: true,
      };

      const response = await adminAPI.createOrUpdateFeeSettings(payload);
      if (response.data.success) {
        toast.success('Fee settings saved successfully')
        const saved = response?.data?.data?.feeSettings;
        if (saved) {
          setFeeSettings({
            singleOrderTiffinAmount: saved.singleOrderTiffinAmount ?? "",
            singleOrderGst: saved.singleOrderGst ?? "",
            singleOrderDeliveryFee: saved.singleOrderDeliveryFee ?? "",
            subscriptionDeliveryFee: saved.subscriptionDeliveryFee ?? "",
            subscriptionGst: saved.subscriptionGst ?? "",
            subscriptionAddonTiffinCharge: saved.subscriptionAddonTiffinCharge ?? "",
          })
        }
      } else {
        toast.error(response.data.message || 'Failed to save fee settings')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save fee settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-[#55254b]" />
            Fee Settings
          </h1>
          <p className="text-sm text-gray-500 mt-1">Configure pricing and delivery fees for single orders and subscriptions.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#55254b] text-white rounded-lg hover:bg-[#431d3b] transition-colors font-medium disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#55254b]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Single Order Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-500" />
                Single Order Settings
              </h2>
            </div>
            <div className="p-5 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tiffin Amount (?)</label>
                <input
                  type="number"
                  value={feeSettings.singleOrderTiffinAmount}
                  onChange={(e) => setFeeSettings({...feeSettings, singleOrderTiffinAmount: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#55254b] focus:border-[#55254b]"
                  placeholder="e.g. 100"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">GST (%)</label>
                <input
                  type="number"
                  value={feeSettings.singleOrderGst}
                  onChange={(e) => setFeeSettings({...feeSettings, singleOrderGst: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#55254b] focus:border-[#55254b]"
                  placeholder="e.g. 5"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Delivery Fee (?)</label>
                <input
                  type="number"
                  value={feeSettings.singleOrderDeliveryFee}
                  onChange={(e) => setFeeSettings({...feeSettings, singleOrderDeliveryFee: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#55254b] focus:border-[#55254b]"
                  placeholder="e.g. 25"
                />
              </div>
            </div>
          </div>

          {/* Subscription Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Package className="w-5 h-5 text-green-500" />
                Subscription Settings
              </h2>
            </div>
            <div className="p-5 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Add-on Tiffin Charge (?)</label>
                <input
                  type="number"
                  value={feeSettings.subscriptionAddonTiffinCharge}
                  onChange={(e) => setFeeSettings({...feeSettings, subscriptionAddonTiffinCharge: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#55254b] focus:border-[#55254b]"
                  placeholder="e.g. 100"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">GST (%)</label>
                <input
                  type="number"
                  value={feeSettings.subscriptionGst}
                  onChange={(e) => setFeeSettings({...feeSettings, subscriptionGst: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#55254b] focus:border-[#55254b]"
                  placeholder="e.g. 5"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Delivery Fee (?)</label>
                <input
                  type="number"
                  value={feeSettings.subscriptionDeliveryFee}
                  onChange={(e) => setFeeSettings({...feeSettings, subscriptionDeliveryFee: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#55254b] focus:border-[#55254b]"
                  placeholder="e.g. 25"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
