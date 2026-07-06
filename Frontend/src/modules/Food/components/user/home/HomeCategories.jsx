import React from "react";

export default function HomeCategories({
  loadingRealCategories,
  homeCategoryTiles,
  selectedHomeCategory,
  setSelectedHomeCategory,
}) {
  return (
    <section className="mt-4 font-['Poppins',sans-serif]">
      <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide -mx-5 px-5 mask-edge-fade">
        {loadingRealCategories && homeCategoryTiles.length === 0 ? (
          Array.from({ length: 5 }).map((_, index) => (
            <div
              key={`home-category-skeleton-${index}`}
              className="flex-shrink-0 w-[130px] h-[172px] rounded-xl border border-slate-100 bg-white shadow-sm p-3 overflow-hidden"
            >
              <div className="mx-auto h-4 w-16 animate-pulse rounded bg-slate-100" />
              <div className="mx-auto mt-4 h-24 w-24 animate-pulse rounded-full bg-orange-100" />
              <div className="mx-auto mt-3 h-3 w-20 animate-pulse rounded bg-slate-100" />
            </div>
          ))
        ) : homeCategoryTiles.length === 0 ? (
          <div className="w-full py-4 text-center text-xs font-semibold text-gray-500">
            No menu categories available
          </div>
        ) : (
          homeCategoryTiles.map((category) => {
            const isSelected = selectedHomeCategory?.slug === category.slug;
            const itemLabel = category.itemName || category.defaultQuantity || category.name;

            return (
              <button
                key={category.id}
                type="button"
                onClick={() => {
                  setSelectedHomeCategory((current) =>
                    current?.slug === category.slug ? null : category,
                  );
                  window.setTimeout(() => {
                    document.getElementById("home-recommended-items")?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }, 80);
                }}
                className="flex-shrink-0 w-[130px] text-left focus:outline-none"
              >
                <div
                  className={`relative h-[172px] rounded-xl bg-white border shadow-sm flex flex-col items-center p-3 overflow-hidden transition-all duration-300 ${
                    isSelected
                      ? "border-[#e92823] ring-2 ring-[#e92823]/15 scale-[1.02]"
                      : "border-slate-100 hover:border-orange-200"
                  }`}
                >
                  <span className="absolute right-3 top-5 h-2 w-2 rounded-full bg-[#22a647] shadow-sm" />

                  <span
                    className={`min-h-[32px] w-full pr-4 text-center text-[13px] font-bold leading-tight line-clamp-2 ${
                      isSelected ? "text-[#e92823]" : "text-slate-800"
                    }`}
                  >
                    {category.name}
                  </span>

                  <div className="mt-2 flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-orange-50 ring-1 ring-slate-100">
                    {category.image ? (
                      <img
                        src={category.image}
                        alt={itemLabel}
                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-3xl font-bold text-[#e92823]">
                        {String(category.name || "M").slice(0, 1).toUpperCase()}
                      </span>
                    )}
                  </div>

                  <span className="mt-3 w-full text-center text-[12px] font-bold leading-tight text-slate-800 line-clamp-2">
                    {itemLabel}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}

