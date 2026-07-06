import { FoodSubscriptionPlan } from '../models/subscriptionPlan.model.js';

const PLAN_TYPES = ['Weekly', 'Monthly', 'Custom'];
const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Lunch + Dinner'];

const defaultPlans = [
    {
        title: 'Weekly Lunch Plan',
        planType: 'Weekly',
        durationDays: 7,
        price: 999,
        mealType: 'Lunch',
        dailyTiffinQuantity: 1,
        deliveryTime: { from: '12:00', to: '14:00' },
        allowMealCustomization: true,
        customizationCutoffTime: '21:00',
        allowSkipDelivery: true,
        allowAddOnTiffin: true,
        description: 'Weekly tiffin subscription for daily lunch.',
        sortOrder: 0
    },
    {
        title: 'Monthly Lunch Plan',
        planType: 'Monthly',
        durationDays: 30,
        price: 3499,
        mealType: 'Lunch',
        dailyTiffinQuantity: 1,
        deliveryTime: { from: '12:00', to: '14:00' },
        allowMealCustomization: true,
        customizationCutoffTime: '21:00',
        allowSkipDelivery: true,
        allowAddOnTiffin: true,
        description: 'Monthly lunch tiffin plan for regular customers.',
        sortOrder: 1
    },
    {
        title: 'Monthly Lunch + Dinner Plan',
        planType: 'Monthly',
        durationDays: 30,
        price: 6499,
        mealType: 'Lunch + Dinner',
        dailyTiffinQuantity: 2,
        deliveryTime: { from: '12:00', to: '21:00' },
        allowMealCustomization: true,
        customizationCutoffTime: '21:00',
        allowSkipDelivery: true,
        allowAddOnTiffin: true,
        description: 'Monthly combo plan for lunch and dinner tiffins.',
        sortOrder: 2
    }
];

const ensureDefaultPlans = async () => {
    const count = await FoodSubscriptionPlan.countDocuments({ isDeleted: { $ne: true } });
    if (count > 0) return;
    await FoodSubscriptionPlan.insertMany(
        defaultPlans.map((plan) => ({
            ...plan,
            subtitle: '',
            badge: '',
            features: [],
            currency: 'INR',
            isActive: true,
            isDeleted: false,
            deletedAt: null
        }))
    );
};

export const listSubscriptionPlans = async ({ publicOnly = false, search = '', status = 'all' } = {}) => {
    await ensureDefaultPlans();
    const filter = { isDeleted: { $ne: true } };
    if (publicOnly) filter.isActive = true;
    if (!publicOnly && status === 'active') filter.isActive = true;
    if (!publicOnly && status === 'inactive') filter.isActive = false;
    const searchText = String(search || '').trim();
    if (searchText) {
        const regex = new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        filter.$or = [
            { title: regex },
            { planType: regex },
            { mealType: regex },
            { description: regex }
        ];
    }
    return FoodSubscriptionPlan.find(filter).sort({ sortOrder: 1, durationDays: 1 }).lean();
};

const getNextSortOrder = async () => {
    const last = await FoodSubscriptionPlan.findOne({ isDeleted: { $ne: true } }).sort({ sortOrder: -1 }).select('sortOrder').lean();
    return (last?.sortOrder ?? -1) + 1;
};

const toBoolean = (value, fallback = false) => {
    if (value === undefined || value === null || value === '') return fallback;
    if (typeof value === 'boolean') return value;
    return String(value).toLowerCase() === 'true';
};

const normalizeEnum = (value, allowed, fallback) => {
    const text = String(value || '').trim();
    return allowed.includes(text) ? text : fallback;
};

const normalizePlanPayload = (payload = {}) => ({
    title: String(payload.title || payload.planName || '').trim(),
    planType: normalizeEnum(payload.planType, PLAN_TYPES, 'Weekly'),
    durationDays: Number(payload.durationDays),
    price: Number(payload.price),
    mealType: normalizeEnum(payload.mealType, MEAL_TYPES, ''),
    dailyTiffinQuantity: Number(payload.dailyTiffinQuantity || 1),
    deliveryTime: {
        from: String(payload.deliveryTime?.from || payload.deliveryFrom || '').trim(),
        to: String(payload.deliveryTime?.to || payload.deliveryTo || '').trim()
    },
    allowMealCustomization: toBoolean(payload.allowMealCustomization, false),
    customizationCutoffTime: String(payload.customizationCutoffTime || '').trim(),
    allowSkipDelivery: toBoolean(payload.allowSkipDelivery, false),
    allowAddOnTiffin: toBoolean(payload.allowAddOnTiffin, false),
    description: String(payload.description || '').trim(),
    sortOrder: payload.sortOrder === undefined && payload.order === undefined ? undefined : Number(payload.sortOrder ?? payload.order),
    isActive: payload.isActive === undefined ? undefined : toBoolean(payload.isActive, true),
    currency: 'INR',
    subtitle: '',
    badge: '',
    features: []
});

const assertValidPlan = (data) => {
    if (!data.title) throw new Error('Plan name is required');
    if (!Number.isFinite(data.durationDays) || data.durationDays <= 0) {
        throw new Error('Duration days must be greater than 0');
    }
    if (!Number.isFinite(data.price) || data.price <= 0) {
        throw new Error('Price must be greater than 0');
    }
    if (!data.mealType) throw new Error('Meal type is required');
    if (!data.deliveryTime?.from || !data.deliveryTime?.to) {
        throw new Error('Delivery time is required');
    }
    if (!Number.isFinite(data.dailyTiffinQuantity) || data.dailyTiffinQuantity <= 0) {
        throw new Error('Daily tiffin quantity must be greater than 0');
    }
};

const assertUniquePlanName = async (title, ignoreId = null) => {
    const filter = {
        title: { $regex: `^${String(title).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
        isDeleted: { $ne: true }
    };
    if (ignoreId) filter._id = { $ne: ignoreId };
    const existing = await FoodSubscriptionPlan.findOne(filter).select('_id').lean();
    if (existing) throw new Error('Duplicate plan names are not allowed');
};

export const createSubscriptionPlan = async (payload) => {
    const data = normalizePlanPayload(payload);
    assertValidPlan(data);
    await assertUniquePlanName(data.title);
    data.sortOrder = data.sortOrder ?? await getNextSortOrder();
    data.isActive = data.isActive ?? true;
    data.isDeleted = false;
    data.deletedAt = null;
    const doc = await FoodSubscriptionPlan.create(data);
    return doc.toObject();
};

export const updateSubscriptionPlan = async (id, payload) => {
    const doc = await FoodSubscriptionPlan.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!doc) return null;
    const data = normalizePlanPayload({ ...doc.toObject(), ...payload });
    assertValidPlan(data);
    await assertUniquePlanName(data.title, doc._id);

    const updates = {};
    const fields = [
        'title',
        'planType',
        'durationDays',
        'price',
        'mealType',
        'dailyTiffinQuantity',
        'deliveryTime',
        'allowMealCustomization',
        'customizationCutoffTime',
        'allowSkipDelivery',
        'allowAddOnTiffin',
        'description',
        'currency',
        'subtitle',
        'badge',
        'features'
    ];
    fields.forEach((field) => {
        if (payload[field] !== undefined || ['currency', 'subtitle', 'badge', 'features'].includes(field)) {
            updates[field] = data[field];
        }
    });
    if (payload.sortOrder !== undefined || payload.order !== undefined) updates.sortOrder = data.sortOrder;
    if (payload.isActive !== undefined) updates.isActive = data.isActive;

    Object.assign(doc, updates);
    await doc.save();
    return doc.toObject();
};

export const deleteSubscriptionPlan = async (id) => {
    const doc = await FoodSubscriptionPlan.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!doc) return { deleted: false };
    doc.isDeleted = true;
    doc.isActive = false;
    doc.deletedAt = new Date();
    await doc.save();
    return { deleted: true };
};

export const toggleSubscriptionPlanStatus = async (id) => {
    const doc = await FoodSubscriptionPlan.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!doc) return null;
    return FoodSubscriptionPlan.findByIdAndUpdate(id, { isActive: !doc.isActive }, { new: true }).lean();
};

export const updateSubscriptionPlanOrder = async (id, sortOrder) => {
    const nextOrder = Number(sortOrder);
    if (Number.isNaN(nextOrder)) return null;
    return FoodSubscriptionPlan.findOneAndUpdate(
        { _id: id, isDeleted: { $ne: true } },
        { sortOrder: nextOrder },
        { new: true }
    ).lean();
};
