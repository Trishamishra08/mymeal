import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  BadgePercent,
  Calendar,
  Clock,
  ConciergeBell,
  Receipt,
  ChevronRight,
  CheckCircle2
} from "lucide-react";

export default function ChooseYourOption() {
  const navigate = useNavigate();

  return (
    <div className="w-full px-4 md:px-6 py-4 md:py-6 bg-white dark:bg-[#0a0a0a] font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Title */}
        <div className="mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white inline-block relative">
            Choose Your Option
            <div className="absolute -bottom-1 left-0 w-12 h-1 bg-[#0ea5e9] rounded-full"></div>
            {/* Wait, the underline in image is green. Let me change it below */}
            <div className="absolute -bottom-1 left-0 w-16 h-1 bg-[#10b981] rounded-full"></div>
          </h2>
        </div>

        <div className="flex flex-row gap-3 md:gap-6 mb-6 w-full">
          {/* Subscription Plan Card */}
          <div className="flex-1 bg-white dark:bg-[#1a1a1a] rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-8 border border-gray-100 dark:border-gray-800 shadow-[0_2px_20px_rgba(0,0,0,0.04)] flex flex-col items-center text-center w-1/2">
            <div className="w-12 h-12 md:w-20 md:h-20 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-3 md:mb-5">
              <div className="relative transform scale-[0.6] md:scale-100">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 8V6C16 4.89543 15.1046 4 14 4H10C8.89543 4 8 4.89543 8 6V8M5 8H19C20.1046 8 21 8.89543 21 10V20C21 21.1046 20.1046 22 19 22H5C3.89543 22 3 21.1046 3 20V10C3 8.89543 3.89543 8 5 8Z" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 16C12 16 14 13 14 12.5C14 11.6716 13.1046 11 12 11C10.8954 11 10 11.6716 10 12.5C10 13 12 16 12 16Z" fill="#10b981"/>
                  <path d="M9 13.5L12 16L15 13.5" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            <h3 className="text-xs sm:text-sm md:text-xl font-bold text-gray-900 dark:text-white mb-1.5 md:mb-3 leading-tight min-h-[32px] md:min-h-0 flex items-center">Subscription Plan</h3>
            <p className="text-[9px] sm:text-[10px] md:text-sm text-gray-500 dark:text-gray-400 mb-3 md:mb-6 leading-tight md:leading-relaxed max-w-[240px]">
              Subscribe for daily tiffin<br className="hidden md:block" /> and get maximum benefits.
            </p>

            <button
              onClick={() => navigate("/food/user/subscription-plans")}
              className="w-full max-w-[280px] bg-[#009247] hover:bg-[#007a3b] text-white font-semibold py-2 px-2 md:py-3.5 md:px-6 rounded-lg md:rounded-xl flex items-center justify-center gap-1 md:gap-2 transition-colors duration-200 mb-4 md:mb-8 text-[10px] sm:text-xs md:text-base"
            >
              View Plans <ChevronRight className="w-3 h-3 md:w-5 md:h-5" />
            </button>

            <div className="flex justify-between w-full max-w-[320px] pt-3 md:pt-6 border-t border-gray-100 dark:border-gray-800">
              <div className="flex flex-col items-center gap-1 md:gap-2 flex-1">
                <div className="w-6 h-6 md:w-10 md:h-10 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                  <ShieldCheck className="w-3 h-3 md:w-5 md:h-5 text-[#10b981]" />
                </div>
                <span className="text-[7px] sm:text-[9px] md:text-xs text-gray-600 dark:text-gray-300 text-center leading-tight">Daily Delivery</span>
              </div>
              <div className="w-px h-6 md:h-10 bg-gray-100 dark:bg-gray-800 self-center"></div>
              <div className="flex flex-col items-center gap-1 md:gap-2 flex-1">
                <div className="w-6 h-6 md:w-10 md:h-10 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                  <BadgePercent className="w-3 h-3 md:w-5 md:h-5 text-[#10b981]" />
                </div>
                <span className="text-[7px] sm:text-[9px] md:text-xs text-gray-600 dark:text-gray-300 text-center leading-tight">Best Value</span>
              </div>
              <div className="w-px h-6 md:h-10 bg-gray-100 dark:bg-gray-800 self-center"></div>
              <div className="flex flex-col items-center gap-1 md:gap-2 flex-1">
                <div className="w-6 h-6 md:w-10 md:h-10 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                  <Calendar className="w-3 h-3 md:w-5 md:h-5 text-[#10b981]" />
                </div>
                <span className="text-[7px] sm:text-[9px] md:text-xs text-gray-600 dark:text-gray-300 text-center leading-tight">Flexible Plans</span>
              </div>
            </div>
          </div>

          {/* One-Time Order Card */}
          <div className="flex-1 bg-white dark:bg-[#1a1a1a] rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-8 border border-gray-100 dark:border-gray-800 shadow-[0_2px_20px_rgba(0,0,0,0.04)] flex flex-col items-center text-center w-1/2">
            <div className="w-12 h-12 md:w-20 md:h-20 bg-orange-50 dark:bg-orange-900/20 rounded-full flex items-center justify-center mb-3 md:mb-5">
              <div className="transform scale-[0.6] md:scale-100">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 8V6C16 4.89543 15.1046 4 14 4H10C8.89543 4 8 4.89543 8 6V8M5 8H19C20.1046 8 21 8.89543 21 10V20C21 21.1046 20.1046 22 19 22H5C3.89543 22 3 21.1046 3 20V10C3 8.89543 3.89543 8 5 8Z" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="14" r="3" stroke="#f97316" strokeWidth="2"/>
                </svg>
              </div>
            </div>

            <h3 className="text-xs sm:text-sm md:text-xl font-bold text-gray-900 dark:text-white mb-1.5 md:mb-3 leading-tight min-h-[32px] md:min-h-0 flex items-center">One-Time Order</h3>
            <p className="text-[9px] sm:text-[10px] md:text-sm text-gray-500 dark:text-gray-400 mb-3 md:mb-6 leading-tight md:leading-relaxed max-w-[240px]">
              Order today's meal<br className="hidden md:block" /> without any commitment.
            </p>

            <button
              onClick={() => navigate("/food/user/one-time-tiffin")}
              className="w-full max-w-[280px] bg-[#ff7a00] hover:bg-[#e66d00] text-white font-semibold py-2 px-2 md:py-3.5 md:px-6 rounded-lg md:rounded-xl flex items-center justify-center gap-1 md:gap-2 transition-colors duration-200 mb-4 md:mb-8 text-[10px] sm:text-xs md:text-base"
            >
              Order Now <ChevronRight className="w-3 h-3 md:w-5 md:h-5" />
            </button>

            <div className="flex justify-between w-full max-w-[320px] pt-3 md:pt-6 border-t border-gray-100 dark:border-gray-800">
              <div className="flex flex-col items-center gap-1 md:gap-2 flex-1">
                <div className="w-6 h-6 md:w-10 md:h-10 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                  <Clock className="w-3 h-3 md:w-5 md:h-5 text-[#f97316]" />
                </div>
                <span className="text-[7px] sm:text-[9px] md:text-xs text-gray-600 dark:text-gray-300 text-center leading-tight">Today's Meal</span>
              </div>
              <div className="w-px h-6 md:h-10 bg-gray-100 dark:bg-gray-800 self-center"></div>
              <div className="flex flex-col items-center gap-1 md:gap-2 flex-1">
                <div className="w-6 h-6 md:w-10 md:h-10 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                  <ConciergeBell className="w-3 h-3 md:w-5 md:h-5 text-[#f97316]" />
                </div>
                <span className="text-[7px] sm:text-[9px] md:text-xs text-gray-600 dark:text-gray-300 text-center leading-tight">No Commitments</span>
              </div>
              <div className="w-px h-6 md:h-10 bg-gray-100 dark:bg-gray-800 self-center"></div>
              <div className="flex flex-col items-center gap-1 md:gap-2 flex-1">
                <div className="w-6 h-6 md:w-10 md:h-10 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                  <Receipt className="w-3 h-3 md:w-5 md:h-5 text-[#f97316]" />
                </div>
                <span className="text-[7px] sm:text-[9px] md:text-xs text-gray-600 dark:text-gray-300 text-center leading-tight">Quick & Easy</span>
              </div>
            </div>
          </div>
        </div>

        {/* Trial Tiffin Banner */}
        <div className="w-full rounded-2xl border-2 border-dashed border-[#86efac] bg-[#f0fdf4] p-4 md:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[#dcfce7] rounded-full flex items-center justify-center shrink-0 relative">
              {/* Sparkles */}
              <div className="absolute -top-1 -left-1 text-yellow-400">âœ¨</div>
              <div className="absolute top-2 -right-1 text-yellow-400">âœ¨</div>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 12V22H4V12" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 7H2V12H22V7Z" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 22V7" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 7H7.5C6.83696 7 6.20107 6.73661 5.73223 6.26777C5.26339 5.79893 5 5.16304 5 4.5C5 3.83696 5.26339 3.20107 5.73223 2.73223C6.20107 2.26339 6.83696 2 7.5 2C9 2 12 7 12 7Z" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 7H16.5C17.163 7 17.7989 6.73661 18.2678 6.26777C18.7366 5.79893 19 5.16304 19 4.5C19 3.83696 18.7366 3.20107 18.2678 2.73223C17.7989 2.26339 17.163 2 16.5 2C15 2 12 7 12 7Z" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">Try MyMeal Trial Tiffin</h3>
              <div className="flex items-center gap-2 text-sm text-gray-600 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#16a34a]" />
                  <span>No commitment</span>
                </div>
                <span className="text-gray-300 font-bold">â€¢</span>
                <span>No auto-renewal</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate("/food/user/subscription-plans?tab=trial")}
            className="w-full sm:w-auto bg-white border border-[#ff7a00] text-[#ff7a00] hover:bg-orange-50 font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors duration-200"
          >
            Claim Trial <ChevronRight className="w-5 h-5 text-[#ff7a00]" />
          </button>
        </div>
      </div>
    </div>
  );
}
