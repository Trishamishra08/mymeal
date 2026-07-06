import React from 'react';
import { Star } from 'lucide-react';

const WhyChooseMyMeal = () => {
  const features = [
    {
      id: 1,
      title: "Fresh Ingredients",
      description: "We use handpicked, high-quality ingredients for every meal.",
      themeColor: "#1B5E20", 
      lineColor: "#4CAF50", 
      icon: (
        <svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="40" fill="#E8F5E9" />
          <circle cx="25" cy="30" r="2" fill="#A5D6A7" />
          <circle cx="80" cy="40" r="2.5" fill="#A5D6A7" />
          <circle cx="20" cy="65" r="2" fill="#81C784" />
          <path d="M35 55 C25 40, 40 30, 45 45 Z" fill="#4CAF50" />
          <path d="M65 55 C75 40, 60 30, 55 45 Z" fill="#388E3C" />
          <path d="M50 55 C45 30, 65 35, 50 50 Z" fill="#2E7D32" />
          <circle cx="60" cy="48" r="8" fill="#F44336" />
          <circle cx="60" cy="48" r="5" fill="#EF5350" />
          <path d="M25 55 Q25 75 40 75 L60 75 Q75 75 75 55 Z" fill="#FFFFFF" stroke="#E0E0E0" strokeWidth="2" />
          <path d="M38 75 L62 75 L60 80 L40 80 Z" fill="#FFFFFF" stroke="#E0E0E0" strokeWidth="2" />
          <ellipse cx="50" cy="85" rx="20" ry="3" fill="#C8E6C9" />
        </svg>
      )
    },
    {
      id: 2,
      title: "Home Style Taste",
      description: "Enjoy tasty, homemade food just like your home-cooked meals.",
      themeColor: "#8D4004", 
      lineColor: "#FF9800", 
      icon: (
        <svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="40" fill="#FFF3E0" />
          <circle cx="25" cy="60" r="2" fill="#FFCC80" />
          <circle cx="75" cy="35" r="2.5" fill="#FFCC80" />
          <circle cx="30" cy="30" r="1.5" fill="#FFB74D" />
          <path d="M45 40 C40 35, 50 30, 45 25" stroke="#795548" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M55 35 C50 30, 60 25, 55 20" stroke="#795548" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M65 40 C60 35, 70 30, 65 25" stroke="#795548" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M30 45 L70 45 C75 45, 75 70, 65 70 L35 70 C25 70, 25 45, 30 45 Z" fill="#FF9800" />
          <path d="M28 45 L72 45 C73 45, 73 48, 72 48 L28 48 C27 48, 27 45, 28 45 Z" fill="#F57C00" />
          <path d="M50 63 C50 63, 44 57, 44 54 C44 52.5, 45.5 51, 47 51 C48 51, 49 51.5, 50 52.5 C51 51.5, 52 51, 53 51 C54.5 51, 56 52.5, 56 54 C56 57, 50 63, 50 63 Z" fill="#FFFFFF" />
          <path d="M30 52 C25 52, 25 60, 30 60" stroke="#E65100" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M70 52 C75 52, 75 60, 70 60" stroke="#E65100" strokeWidth="3" strokeLinecap="round" fill="none" />
        </svg>
      )
    },
    {
      id: 3,
      title: "On-Time Delivery",
      description: "We ensure your meals reach you fresh and on time, every day.",
      themeColor: "#0D2C54", 
      lineColor: "#2196F3", 
      icon: (
        <svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="40" fill="#E3F2FD" />
          <circle cx="25" cy="60" r="2" fill="#42A5F5" />
          <circle cx="80" cy="35" r="2" fill="#90CAF9" />
          <path d="M20 50 L28 50" stroke="#1565C0" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M24 43 L32 43" stroke="#1565C0" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M22 57 L26 57" stroke="#1565C0" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M40 60 L65 60 L68 50 L55 50 L50 40 L42 40 L40 60 Z" fill="#64B5F6" />
          <path d="M68 50 L72 50 L75 60 L65 60 Z" fill="#42A5F5" />
          <circle cx="45" cy="65" r="5" fill="#1A237E" />
          <circle cx="45" cy="65" r="2" fill="#FFFFFF" />
          <circle cx="68" cy="65" r="5" fill="#1A237E" />
          <circle cx="68" cy="65" r="2" fill="#FFFFFF" />
          <rect x="32" y="42" width="12" height="15" rx="1" fill="#1565C0" />
          <path d="M55 50 L52 35 L58 35" stroke="#0D47A1" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </svg>
      )
    },
    {
      id: 4,
      title: "Hygienic & Safe",
      description: "Prepared in a clean, sanitized kitchen you can trust.",
      themeColor: "#1B5E20", 
      lineColor: "#4CAF50", 
      icon: (
        <svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="40" fill="#E8F5E9" />
          <circle cx="25" cy="60" r="2" fill="#A5D6A7" />
          <circle cx="80" cy="35" r="2" fill="#A5D6A7" />
          <path d="M50 25 L30 32 V50 C30 65, 45 75, 50 78 C55 75, 70 65, 70 50 V32 L50 25 Z" fill="#4CAF50" />
          <path d="M50 32 L36 37 V50 C36 61, 45 68, 50 70 C55 68, 64 61, 64 50 V37 L50 32 Z" fill="#FFFFFF" />
          <path d="M42 52 L47 57 L58 43" stroke="#4CAF50" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <ellipse cx="50" cy="85" rx="20" ry="3" fill="#C8E6C9" />
        </svg>
      )
    }
  ];

  return (
    <div className="w-full pt-6 pb-2 md:py-8 bg-white dark:bg-[#0a0a0a] font-[Poppins]">
      <div className="px-5 md:px-6 max-w-7xl mx-auto">
        <div>
          
          {/* Header Section */}
          <div className="flex items-start gap-4 mb-6 md:mb-8">
            <div className="bg-[#E8F5E9] p-3 rounded-full shrink-0 flex items-center justify-center">
              <div className="bg-[#2E7D32] rounded-full p-1.5">
                <Star className="w-4 h-4 text-white fill-white" />
              </div>
            </div>
            <div>
              <h2 className="text-[20px] md:text-[22px] leading-[28px] md:leading-[30px] font-bold text-[#101828] mb-1">
                Why Choose MyMeal?
              </h2>
              <p className="text-[13px] md:text-[14px] leading-[20px] md:leading-[22px] font-normal text-[#667085]">
                Healthy meals, made with love and delivered with care
              </p>
            </div>
          </div>

          {/* Cards Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 pb-4">
            {features.map((feature) => (
              <div
                key={feature.id}
                className="bg-white rounded-xl md:rounded-2xl p-3 md:p-6 border border-gray-100 shadow-[0px_2px_12px_rgba(0,0,0,0.04)] flex flex-col items-center text-center"
              >
                <div className="mb-3 md:mb-6 flex justify-center scale-[0.8] md:scale-100 origin-center">
                  {feature.icon}
                </div>
                
                <h3 
                  className="text-[13px] md:text-[16px] leading-[18px] md:leading-[24px] font-bold mb-1 md:mb-2"
                  style={{ color: feature.themeColor }}
                >
                  {feature.title}
                </h3>
                
                <div 
                  className="w-6 md:w-8 h-[2px] md:h-[3px] rounded-full mb-2 md:mb-4"
                  style={{ backgroundColor: feature.lineColor }}
                ></div>
                
                <p className="text-[11px] md:text-[13px] leading-[16px] md:leading-[20px] font-medium text-[#475467]">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

        </div>
      </div>

    </div>
  );
};

export default WhyChooseMyMeal;
