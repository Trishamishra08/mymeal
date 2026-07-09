import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import apiClient from "@food/api";
import { API_BASE_URL } from "@food/api/config.js";
import OptimizedImage from "@food/components/OptimizedImage";
import { format } from "date-fns";

const resolveImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const baseUrl = (API_BASE_URL || 'http://localhost:5000/api/v1').replace(/\/api\/v1\/?$/, '');
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

export default function TodayDefaultTiffin() {
  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchMenu = async () => {
      try {
        const res = await apiClient.get('/food/orders/one-time-tiffin/menu/public');
        if (!mounted) return;
        const data = res?.data?.data || {};
        if (data && data.categories) {
          setMenu(data);
        }
      } catch (err) {
        console.error("Failed to load default tiffin menu:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchMenu();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading || !menu) {
    return null; // Do not show if loading
  }

  const defaultItems = (menu.categories || []).map((cat) => {
    return {
      categoryName: cat.categoryName,
      ...cat.defaultItem
    };
  }).filter(item => item && item.itemId);

  // Helpers for category colors
  const getCategoryColor = (name) => {
    const lower = String(name).toLowerCase();
    if (lower.includes("sabzi") || lower.includes("dal") || lower.includes("veg")) return "bg-[#EF4444] text-white";
    if (lower.includes("rice")) return "bg-[#2563EB] text-white";
    if (lower.includes("roti") || lower.includes("bread")) return "bg-amber-700 text-white";
    return "bg-primary text-white";
  };

  const getCategoryStarColor = (name) => {
    const lower = String(name).toLowerCase();
    if (lower.includes("sabzi") || lower.includes("dal") || lower.includes("veg")) return "text-[#EF4444]";
    if (lower.includes("rice")) return "text-[#2563EB]";
    if (lower.includes("roti") || lower.includes("bread")) return "text-amber-700";
    return "text-primary";
  };
  
  const getCategoryBadgeBg = (name) => {
    const lower = String(name).toLowerCase();
    if (lower.includes("sabzi") || lower.includes("dal") || lower.includes("veg")) return "bg-[#FEE2E2]";
    if (lower.includes("rice")) return "bg-[#DBEAFE]";
    if (lower.includes("roti") || lower.includes("bread")) return "bg-amber-50";
    return "bg-primary/10";
  };

  return (
    <div className="w-full py-4 md:py-6 bg-white dark:bg-[#0a0a0a] font-[Poppins]">
      <div className="px-5 md:px-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-start gap-3">
            <div className="bg-green-100 p-2.5 rounded-full shrink-0">
            <svg
              width="28"
              height="28"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-[#009247]"
            >
              {/* Base */}
              <path d="M4 23C4 21.9 4.9 21 6 21H26C27.1 21 28 21.9 28 23C28 24.1 27.1 25 26 25H6C4.9 25 4 24.1 4 23Z" fill="currentColor" />
              {/* Dome */}
              <path d="M7 20.5C7 15.5 11 11.5 16 11.5C21 11.5 25 15.5 25 20.5H7Z" fill="currentColor" />
              {/* Knob */}
              <circle cx="16" cy="10" r="2" fill="currentColor" />
              {/* Steam 1 */}
              <path d="M13 7C12.5 6 13.5 5 13 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              {/* Steam 2 */}
              <path d="M18 6C17.5 5 18.5 4 18 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              {/* Highlight */}
              <path d="M10 18.5C10 16.5 11.5 15 13.5 15" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            </div>
            <div>
              <h2 className="text-[20px] leading-[28px] font-semibold text-[#1A1A1A] dark:text-white">
                Today's Default Tiffin
              </h2>
              <p className="text-[13px] leading-[20px] font-normal text-[#6B7280] dark:text-gray-400 mt-0.5">
                Freshly prepared & delivered to your door
              </p>
            </div>
          </div>

        </div>

        {defaultItems.length === 0 ? (
          <div className="w-full bg-gray-50 dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-gray-800 p-8 text-center flex flex-col items-center justify-center">
            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-full mb-3">
              <Star className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-1">Menu Not Available</h3>
            <p className="text-sm text-gray-500 max-w-sm">
              Today's menu has not been set yet. Please check back a bit later!
            </p>
          </div>
        ) : (
        <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory hide-scrollbar pl-1">
        {defaultItems.map((item, index) => (
          <div
            key={item.itemId || index}
            className="snap-start shrink-0 w-[180px] bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col relative"
          >
            <div className="absolute top-3 left-3 z-10">
              <span
                className={`px-3 py-1 rounded-md text-[11px] leading-[16px] font-semibold shadow-sm ${getCategoryColor(item.categoryName)}`}
              >
                {item.categoryName}
              </span>
            </div>

            <div className="h-[120px] w-full bg-white relative">
              <OptimizedImage
                src={resolveImageUrl(item.imageUrl || item.image)}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="p-4 flex flex-col flex-1">
              <h3 className="text-[16px] leading-[24px] font-semibold text-[#111827] dark:text-white mb-1 line-clamp-1">
                {item.name}
              </h3>
              <p className="text-[13px] leading-[20px] font-normal text-[#6B7280] dark:text-gray-400 line-clamp-2 mb-4 flex-1">
                {item.description || `Freshly prepared ${item.name}`}
              </p>

              <div className="mt-auto">
                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md ${getCategoryBadgeBg(item.categoryName)}`}>
                  <Star className={`h-3.5 w-3.5 fill-current ${getCategoryStarColor(item.categoryName)}`} />
                  <span className={`text-[12px] leading-[16px] font-medium ${getCategoryStarColor(item.categoryName)}`}>
                    Default
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}
      <style dangerouslySetInnerHTML={{ __html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
      </div>
    </div>
  );
}
