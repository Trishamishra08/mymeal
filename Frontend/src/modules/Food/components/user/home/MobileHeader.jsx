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

            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={handleSearchFocus}
                className="h-10 flex-1 bg-white rounded-full border border-gray-200 shadow-sm px-3 flex items-center gap-2 text-left"
              >
                <Search className="h-4 w-4 text-gray-400" />
                <span className="text-xs font-medium text-gray-400 truncate">
                  Search meals, plans...
                </span>
                <Mic className="h-4 w-4 text-gray-400 ml-auto" />
              </button>
              
              <button
                ref={toggleRef}
                type="button"
                onClick={() => handleVegModeChange?.(!vegMode)}
                className={`h-10 px-3 rounded-full flex items-center gap-1.5 shadow-sm transition-colors border border-transparent ${
                  vegMode ? "bg-[#1F6B3A] text-white" : "bg-white border-gray-200 text-gray-700"
                }`}
                aria-label="Toggle veg mode"
              >
                <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${vegMode ? 'border-white' : 'border-[#1F6B3A]'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${vegMode ? 'bg-white' : 'bg-[#1F6B3A]'}`} />
                </div>
                <span className="text-xs font-bold whitespace-nowrap">Veg Mode</span>
                <ChevronDown className={`h-3 w-3 ${vegMode ? 'text-white' : 'text-gray-500'}`} />
              </button>
            </div>
          </header>
  );
}
