import React, { useState, useEffect } from "react";
import { MapPin, ChevronDown, Search, Mic, ShoppingCart, Bell } from "lucide-react";
import { getCachedSettings, loadBusinessSettings } from "@food/utils/businessSettings";

export default function MobileHeader({ 
  effectiveLocation, 
  handleLocationClick, 
  handleSearchFocus, 
  vegMode,
  handleVegModeChange,
  toggleRef
}) {
  const [brand, setBrand] = useState(() => {
    const cached = getCachedSettings();
    return {
      logoUrl: cached?.logo?.url || null,
      companyName: cached?.companyName || "My Meal",
    };
  });

  useEffect(() => {
    let cancelled = false;

    const applySettings = (settings) => {
      if (!settings || cancelled) return;
      setBrand({
        logoUrl: settings.logo?.url || null,
        companyName: settings.companyName || "My Meal",
      });
    };

    applySettings(getCachedSettings());

    loadBusinessSettings()
      .then(applySettings)
      .catch(() => {});

    const handleSettingsUpdate = () => {
      applySettings(getCachedSettings());
    };

    window.addEventListener("businessSettingsUpdated", handleSettingsUpdate);
    return () => {
      cancelled = true;
      window.removeEventListener("businessSettingsUpdated", handleSettingsUpdate);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md px-4 pt-3 pb-2 shadow-sm">
            <div className="relative flex min-h-[34px] items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleLocationClick}
                className="min-w-0 max-w-[34%] flex items-center gap-1 text-left"
              >
                <MapPin className="h-4 w-4 text-[#1F6B3A]" />
                <span className="text-[12px] font-bold text-gray-800 truncate">
                  {effectiveLocation?.area || effectiveLocation?.city || "Chhoti Gwaltoli"}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-gray-600" />
              </button>

              <div className="absolute left-1/2 top-1/2 w-[38%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center gap-1.5 pointer-events-none">
                {brand.logoUrl && (
                  <img src={brand.logoUrl} alt="Logo" className="h-7 w-auto object-contain drop-shadow-sm" />
                )}
                <div className="flex flex-col items-start justify-center">
                  <div className="text-[16px] leading-none font-black tracking-tight">
                    <span className="text-[#D68B2A]">My </span>
                    <span className="text-[#1F6B3A]">Meal</span>
                  </div>
                  <div className="text-[5px] font-black text-[#1F6B3A] tracking-[0.12em] mt-0.5 uppercase">
                    Tiffin Service
                  </div>
                </div>
              </div>

              <div className="ml-auto flex items-center justify-end gap-3 text-gray-700">
                <Bell className="h-5 w-5" />
                <div className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-[#1F6B3A] text-white flex items-center justify-center text-[9px] font-bold border-2 border-white">
                    2
                  </span>
                </div>
              </div>
            </div>


          </header>
  );
}
