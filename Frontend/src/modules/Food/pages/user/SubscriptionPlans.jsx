import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarCheck,
  ChevronRight,
  Clock3,
  Edit3,
  MessageCircle,
  ShieldCheck,
  UserCircle2,
} from "lucide-react";
import api from "@food/api";
import { loadAppCustomization } from "@food/utils/appCustomization";

const featureIcons = [Clock3, CalendarCheck, ShieldCheck];

export default function SubscriptionPlans() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    loadAppCustomization()
      .then((settings) => {
        if (mounted && settings.subscriptionFlowEnabled === false) {
          navigate("/food/user", { replace: true });
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [navigate]);

  const dish = useMemo(() => {
    const stateDish = location.state?.dish || {};
    return {
      id: stateDish.id || stateDish.itemId || searchParams.get("dishId") || "",
      itemId: stateDish.itemId || stateDish.id || searchParams.get("dishId") || "",
      name: stateDish.name || searchParams.get("dish") || "Selected meal",
      categoryName: stateDish.categoryName || searchParams.get("category") || "",
      price: stateDish.price || searchParams.get("price") || "",
      image: stateDish.image || "",
      foodType: stateDish.foodType || "",
    };
  }, [location.state, searchParams]);

  const selectedMeals = useMemo(() => {
    const meals = Array.isArray(location.state?.selectedMeals)
      ? location.state.selectedMeals
      : [];
    return meals.filter(Boolean);
  }, [location.state]);

  const selectedMealCount = selectedMeals.length || 1;
  const selectedDishPrice = Number(dish.price || 0) || 0;

  useEffect(() => {
    let cancelled = false;

    const loadPlans = async () => {
      setLoading(true);
      try {
        const response = await api.get("/food/subscription-plans/public");
        const apiPlans = response?.data?.data?.plans || response?.data?.plans || [];
        const mapped = apiPlans
          .filter((plan) => plan?.title && plan?.durationDays)
          .map((plan, index) => ({
            ...plan,
            id: plan._id || plan.id || `plan-${index}`,
            title: plan.title,
            durationDays: plan.durationDays,
            subtitle: plan.subtitle || "",
            description: plan.description || "",
            badge: plan.badge || "",
            currency: plan.currency || "INR",
            features: Array.isArray(plan.features) ? plan.features : [],
          }));

        if (!cancelled) {
          setPlans(mapped);
        }
      } catch {
        if (!cancelled) setPlans([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadPlans();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-24 pt-4">
        <header className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-gray-900 active:bg-gray-100"
            aria-label="Go back"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="flex-1 text-left text-lg font-bold">
            Choose your plan
          </h1>
          <button
            type="button"
            onClick={() => navigate("/food/user/profile")}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-700 shadow-sm"
            aria-label="Profile"
          >
            <UserCircle2 className="h-6 w-6" />
          </button>
        </header>

        <main className="mt-5 space-y-4">
          {loading && plans.length === 0 ? (
            <div className="rounded-[16px] border border-red-100 p-8 text-center text-sm font-medium text-gray-400">
              Loading subscription plans...
            </div>
          ) : (
            plans.length > 0 ? plans.map((plan) => (
              <article
                key={plan.id}
                className="rounded-[20px] border border-[#e3282c] bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-bold">
                      {plan.title}
                    </h2>
                    {plan.subtitle && (
                      <p className="mt-1 text-sm font-medium text-gray-600">
                        {plan.subtitle}
                      </p>
                    )}
                    {plan.description && (
                      <p className="mt-2 text-sm text-gray-500 leading-snug">
                        {plan.description}
                      </p>
                    )}
                  </div>
                  {plan.badge && (
                    <span className="rounded-full bg-[#e3282c] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                      {plan.badge}
                    </span>
                  )}
                </div>

                {/* Plan Details Grid */}
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  {plan.planType && (
                    <div className="flex flex-col rounded-md bg-gray-50 p-2 border border-gray-100">
                      <span className="text-[10px] text-gray-500 font-medium">Plan Type</span>
                      <span className="font-semibold text-gray-800">{plan.planType}</span>
                    </div>
                  )}
                  {plan.mealType && (
                    <div className="flex flex-col rounded-md bg-gray-50 p-2 border border-gray-100">
                      <span className="text-[10px] text-gray-500 font-medium">Meal Type</span>
                      <span className="font-semibold text-gray-800">{plan.mealType}</span>
                    </div>
                  )}
                  {plan.dailyTiffinQuantity > 0 && (
                    <div className="flex flex-col rounded-md bg-gray-50 p-2 border border-gray-100">
                      <span className="text-[10px] text-gray-500 font-medium">Tiffin Qty/Day</span>
                      <span className="font-semibold text-gray-800">{plan.dailyTiffinQuantity}</span>
                    </div>
                  )}
                  {plan.deliveryTime?.from && plan.deliveryTime?.to && (
                    <div className="flex flex-col rounded-md bg-gray-50 p-2 border border-gray-100">
                      <span className="text-[10px] text-gray-500 font-medium">Delivery</span>
                      <span className="font-semibold text-gray-800">{plan.deliveryTime.from} - {plan.deliveryTime.to}</span>
                    </div>
                  )}
                  {plan.allowMealCustomization && (
                    <div className="flex flex-col rounded-md bg-gray-50 p-2 border border-gray-100">
                      <span className="text-[10px] text-gray-500 font-medium">Customization</span>
                      <span className="font-semibold text-gray-800">Allowed {plan.customizationCutoffTime && `(by ${plan.customizationCutoffTime})`}</span>
                    </div>
                  )}
                  {plan.allowSkipDelivery && (
                    <div className="flex flex-col rounded-md bg-gray-50 p-2 border border-gray-100">
                      <span className="text-[10px] text-gray-500 font-medium">Skip Delivery</span>
                      <span className="font-semibold text-gray-800">Allowed</span>
                    </div>
                  )}
                </div>

                <div className="mt-6 bg-[#fafafa] rounded-[12px] p-3 border border-gray-100">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#e3282c]">
                    Pricing
                  </p>
                  <p className="mt-1 text-[15px] font-bold text-gray-900">
                    {plan.currency} {plan.price ? plan.price.toLocaleString("en-IN") : 0} + GST + delivery
                  </p>
                  <p className="mt-1 text-xs font-medium text-gray-500">
                    {plan.durationDays} days • {plan.mealType || "Meals"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const params = new URLSearchParams();
                    if (dish.itemId || dish.id) params.set("dishId", dish.itemId || dish.id);
                    if (dish.name) params.set("dish", dish.name);
                    if (dish.categoryName) params.set("category", dish.categoryName);
                    if (dish.price) params.set("price", String(dish.price));
                    if (plan.id) params.set("planId", plan.id);

                    navigate({
                      pathname: "/food/user/checkout",
                      search: params.toString() ? `?${params.toString()}` : "",
                    }, {
                      state: { dish, selectedMeals, subscriptionPlan: plan },
                    });
                  }}
                  className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#e3282c] text-sm font-bold text-white transition active:bg-[#c42226]"
                >
                  Continue
                  <ChevronRight className="h-4 w-4" />
                </button>

                {plan.features.length > 0 && (
                  <div className="mt-5 border-t border-gray-100 pt-5">
                    <div className="space-y-3.5">
                      {plan.features.map((feature, index) => {
                        const Icon = featureIcons[index % featureIcons.length];
                        return (
                          <div key={`${plan.id}-${feature}`} className="flex items-center gap-3">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-[#e3282c]">
                              <Icon className="h-4 w-4" />
                            </span>
                            <span className="text-sm font-medium text-gray-700">
                              {feature}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </article>
            )) : (
               <div className="rounded-[16px] border border-dashed border-red-100 p-8 text-center text-sm font-medium text-gray-400">
                No subscription plans available.
              </div>
            )
          )}
        </main>


      </div>
    </div>
  );
}
