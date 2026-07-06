import mongoose from 'mongoose';
import { MyMealDailyMenu } from '../models/dailyMenu.model.js';
import { MyMealMenuCategory } from '../models/menuCategory.model.js';
import { MyMealMenuItem } from '../models/menuItem.model.js';

const ok = (res, data = {}, message = 'Success', status = 200) => res.status(status).json({ success: true, message, data });
const fail = (res, message = 'Invalid request', status = 400) => res.status(status).json({ success: false, message });

const nameKey = (value = '') => String(value).trim().replace(/\s+/g, ' ').toLowerCase();
const toBool = (value, fallback = true) => {
    if (typeof value === 'boolean') return value;
    if (value === 'true') return true;
    if (value === 'false') return false;
    return fallback;
};
const toNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};
const isId = (id) => mongoose.Types.ObjectId.isValid(String(id || ''));
const dateKey = (value) => {
    const raw = String(value || '').trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : '';
};
const adminId = (req) => req.user?._id || req.user?.id;

const pagination = (query) => {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
    return { page, limit, skip: (page - 1) * limit };
};
export const listPublicMenuCategories = async (req, res, next) => {
    try {
        const limit = Math.min(24, Math.max(1, parseInt(req.query.limit, 10) || 12));
        const categories = await MyMealMenuCategory.find({ status: true })
            .sort({ displayOrder: 1, createdAt: -1 })
            .limit(limit)
            .lean();
        const categoryIds = categories.map((category) => category._id);
        const items = categoryIds.length
            ? await MyMealMenuItem.find({
                categoryId: { $in: categoryIds },
                status: true,
                availability: true,
            })
                .sort({ categoryId: 1, createdAt: -1 })
                .lean()
            : [];

        const itemMap = new Map();
        items.forEach((item) => {
            const key = String(item.categoryId);
            if (!itemMap.has(key)) itemMap.set(key, item);
        });

        const rows = categories.map((category) => {
            const featuredItem = itemMap.get(String(category._id)) || null;
            return {
                id: String(category._id),
                categoryId: String(category._id),
                name: category.name,
                slug: category.nameKey,
                imageUrl: featuredItem?.imageUrl || category.imageUrl || '',
                itemName: featuredItem?.name || '',
                itemId: featuredItem?._id ? String(featuredItem._id) : '',
                defaultQuantity: featuredItem?.defaultQuantity || '',
                displayOrder: category.displayOrder || 0,
            };
        });

        return ok(res, { categories: rows });
    } catch (error) {
        return next(error);
    }
};

export const listMenuCategories = async (req, res, next) => {
    try {
        const { page, limit, skip } = pagination(req.query);
        const filter = {};
        if (req.query.search) filter.name = { $regex: String(req.query.search).trim(), $options: 'i' };
        if (req.query.status === 'active') filter.status = true;
        if (req.query.status === 'inactive') filter.status = false;

        const [categories, total, counts] = await Promise.all([
            MyMealMenuCategory.find(filter).sort({ displayOrder: 1, createdAt: -1 }).skip(skip).limit(limit).lean(),
            MyMealMenuCategory.countDocuments(filter),
            MyMealMenuItem.aggregate([{ $group: { _id: '$categoryId', totalItems: { $sum: 1 } } }]),
        ]);
        const countMap = new Map(counts.map((row) => [String(row._id), row.totalItems]));
        return ok(res, {
            categories: categories.map((category) => ({ ...category, totalItems: countMap.get(String(category._id)) || 0 })),
            pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
        });
    } catch (error) {
        return next(error);
    }
};

export const createMenuCategory = async (req, res, next) => {
    try {
        const key = nameKey(req.body.name);
        if (!key) return fail(res, 'Category name is required');
        const exists = await MyMealMenuCategory.exists({ nameKey: key });
        if (exists) return fail(res, 'Category name must be unique', 409);
        const category = await MyMealMenuCategory.create({
            name: String(req.body.name).trim(),
            nameKey: key,
            imageUrl: String(req.body.imageUrl || '').trim(),
            description: String(req.body.description || '').trim(),
            displayOrder: toNumber(req.body.displayOrder),
            status: toBool(req.body.status, true),
            createdBy: adminId(req),
        });
        return ok(res, { category }, 'Category created', 201);
    } catch (error) {
        return next(error);
    }
};

export const updateMenuCategory = async (req, res, next) => {
    try {
        if (!isId(req.params.id)) return fail(res, 'Invalid category id', 404);
        const category = await MyMealMenuCategory.findById(req.params.id);
        if (!category) return fail(res, 'Category not found', 404);
        if (req.body.name !== undefined) {
            const key = nameKey(req.body.name);
            if (!key) return fail(res, 'Category name is required');
            const exists = await MyMealMenuCategory.exists({ _id: { $ne: category._id }, nameKey: key });
            if (exists) return fail(res, 'Category name must be unique', 409);
            category.name = String(req.body.name).trim();
            category.nameKey = key;
        }
        ['imageUrl', 'description'].forEach((field) => {
            if (req.body[field] !== undefined) category[field] = String(req.body[field] || '').trim();
        });
        if (req.body.displayOrder !== undefined) category.displayOrder = toNumber(req.body.displayOrder);
        if (req.body.status !== undefined) category.status = toBool(req.body.status, category.status);
        category.updatedBy = adminId(req);
        await category.save();
        return ok(res, { category }, 'Category updated');
    } catch (error) {
        return next(error);
    }
};

export const toggleMenuCategoryStatus = async (req, res, next) => {
    try {
        if (!isId(req.params.id)) return fail(res, 'Invalid category id', 404);
        const category = await MyMealMenuCategory.findByIdAndUpdate(
            req.params.id,
            { status: toBool(req.body.status, true), updatedBy: adminId(req) },
            { new: true },
        );
        if (!category) return fail(res, 'Category not found', 404);
        return ok(res, { category }, 'Category status updated');
    } catch (error) {
        return next(error);
    }
};

export const deleteMenuCategory = async (req, res, next) => {
    try {
        if (!isId(req.params.id)) return fail(res, 'Invalid category id', 404);
        const linkedItems = await MyMealMenuItem.countDocuments({ categoryId: req.params.id });
        if (linkedItems > 0) return fail(res, 'Cannot delete category while items exist', 409);
        const deleted = await MyMealMenuCategory.findByIdAndDelete(req.params.id);
        if (!deleted) return fail(res, 'Category not found', 404);
        return ok(res, {}, 'Category deleted');
    } catch (error) {
        return next(error);
    }
};

export const listMenuItems = async (req, res, next) => {
    try {
        const { page, limit, skip } = pagination(req.query);
        const filter = {};
        if (req.query.search) filter.name = { $regex: String(req.query.search).trim(), $options: 'i' };
        if (isId(req.query.categoryId)) filter.categoryId = req.query.categoryId;
        if (req.query.status === 'active') filter.status = true;
        if (req.query.status === 'inactive') filter.status = false;
        if (req.query.availability === 'available') filter.availability = true;
        if (req.query.availability === 'unavailable') filter.availability = false;

        const [items, total] = await Promise.all([
            MyMealMenuItem.find(filter).populate('categoryId', 'name status').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            MyMealMenuItem.countDocuments(filter),
        ]);
        return ok(res, { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 } });
    } catch (error) {
        return next(error);
    }
};

export const createMenuItem = async (req, res, next) => {
    try {
        const key = nameKey(req.body.name);
        if (!key) return fail(res, 'Item name is required');
        if (!isId(req.body.categoryId)) return fail(res, 'Valid category is required');
        const category = await MyMealMenuCategory.findById(req.body.categoryId);
        if (!category) return fail(res, 'Category not found', 404);
        const exists = await MyMealMenuItem.exists({ nameKey: key, categoryId: category._id });
        if (exists) return fail(res, 'Item name already exists in this category', 409);
        const item = await MyMealMenuItem.create({
            name: String(req.body.name).trim(),
            nameKey: key,
            categoryId: category._id,
            imageUrl: String(req.body.imageUrl || '').trim(),
            price: Math.max(0, toNumber(req.body.price)),
            description: String(req.body.description || '').trim(),
            preparationTime: Math.max(0, toNumber(req.body.preparationTime)),
            calories: Math.max(0, toNumber(req.body.calories)),
            defaultQuantity: String(req.body.defaultQuantity || '1 portion').trim(),
            availability: toBool(req.body.availability, true),
            status: toBool(req.body.status, true),
            createdBy: adminId(req),
        });
        return ok(res, { item }, 'Item created', 201);
    } catch (error) {
        return next(error);
    }
};

export const updateMenuItem = async (req, res, next) => {
    try {
        if (!isId(req.params.id)) return fail(res, 'Invalid item id', 404);
        const item = await MyMealMenuItem.findById(req.params.id);
        if (!item) return fail(res, 'Item not found', 404);
        const categoryId = req.body.categoryId !== undefined ? req.body.categoryId : item.categoryId;
        if (!isId(categoryId)) return fail(res, 'Valid category is required');
        const category = await MyMealMenuCategory.findById(categoryId);
        if (!category) return fail(res, 'Category not found', 404);
        const key = req.body.name !== undefined ? nameKey(req.body.name) : item.nameKey;
        if (!key) return fail(res, 'Item name is required');
        const exists = await MyMealMenuItem.exists({ _id: { $ne: item._id }, nameKey: key, categoryId: category._id });
        if (exists) return fail(res, 'Item name already exists in this category', 409);

        if (req.body.name !== undefined) item.name = String(req.body.name).trim();
        item.nameKey = key;
        item.categoryId = category._id;
        ['imageUrl', 'description', 'defaultQuantity'].forEach((field) => {
            if (req.body[field] !== undefined) item[field] = String(req.body[field] || '').trim();
        });
        ['price', 'preparationTime', 'calories'].forEach((field) => {
            if (req.body[field] !== undefined) item[field] = Math.max(0, toNumber(req.body[field]));
        });
        if (req.body.availability !== undefined) item.availability = toBool(req.body.availability, item.availability);
        if (req.body.status !== undefined) item.status = toBool(req.body.status, item.status);
        item.updatedBy = adminId(req);
        await item.save();
        return ok(res, { item }, 'Item updated');
    } catch (error) {
        return next(error);
    }
};

export const toggleMenuItemStatus = async (req, res, next) => {
    try {
        if (!isId(req.params.id)) return fail(res, 'Invalid item id', 404);
        const item = await MyMealMenuItem.findByIdAndUpdate(
            req.params.id,
            { status: toBool(req.body.status, true), updatedBy: adminId(req) },
            { new: true },
        );
        if (!item) return fail(res, 'Item not found', 404);
        return ok(res, { item }, 'Item status updated');
    } catch (error) {
        return next(error);
    }
};

export const toggleMenuItemAvailability = async (req, res, next) => {
    try {
        if (!isId(req.params.id)) return fail(res, 'Invalid item id', 404);
        const item = await MyMealMenuItem.findByIdAndUpdate(
            req.params.id,
            { availability: toBool(req.body.availability, true), updatedBy: adminId(req) },
            { new: true },
        );
        if (!item) return fail(res, 'Item not found', 404);
        return ok(res, { item }, 'Item availability updated');
    } catch (error) {
        return next(error);
    }
};

export const deleteMenuItem = async (req, res, next) => {
    try {
        if (!isId(req.params.id)) return fail(res, 'Invalid item id', 404);
        const deleted = await MyMealMenuItem.findByIdAndDelete(req.params.id);
        if (!deleted) return fail(res, 'Item not found', 404);
        return ok(res, {}, 'Item deleted');
    } catch (error) {
        return next(error);
    }
};

const buildDailyMenuPayload = async ({ menuDate, selectedItems = [], defaultItems = [] }) => {
    const categories = await MyMealMenuCategory.find({ status: true }).sort({ displayOrder: 1, name: 1 }).lean();
    const categoryIds = categories.map((category) => category._id);
    const items = await MyMealMenuItem.find({
        categoryId: { $in: categoryIds },
        status: true,
        availability: true,
    }).sort({ name: 1 }).lean();

    const selectedMap = new Map((selectedItems || []).map((row) => [String(row.categoryId), new Set((row.itemIds || []).map(String))]));
    const defaultMap = new Map((defaultItems || []).map((row) => [String(row.categoryId), String(row.itemId)]));
    const itemMap = new Map(items.map((item) => [String(item._id), item]));
    const grouped = new Map();
    items.forEach((item) => {
        const key = String(item.categoryId);
        grouped.set(key, [...(grouped.get(key) || []), item]);
    });

    const normalizedSelected = [];
    const normalizedDefault = [];
    const snapshot = [];

    for (const category of categories) {
        const key = String(category._id);
        const availableItems = grouped.get(key) || [];
        if (!availableItems.length) continue;
        const selectedIds = [...(selectedMap.get(key) || new Set())].filter((itemId) => itemMap.has(itemId) && String(itemMap.get(itemId).categoryId) === key);
        if (!selectedIds.length) {
            continue;
        }
        
        normalizedSelected.push({ categoryId: category._id, itemIds: selectedIds });
        
        const defaultId = defaultMap.get(key);
        let validDefaultId = null;
        if (defaultId && selectedIds.includes(defaultId)) {
            normalizedDefault.push({ categoryId: category._id, itemId: defaultId });
            validDefaultId = defaultId;
        }

        const snapshotItems = selectedIds.map((itemId) => {
            const item = itemMap.get(itemId);
            return {
                itemId: item._id,
                itemName: item.name,
                price: item.price,
                imageUrl: item.imageUrl,
                defaultQuantity: item.defaultQuantity,
            };
        });
        
        snapshot.push({
            categoryId: category._id,
            categoryName: category.name,
            items: snapshotItems,
            defaultItem: validDefaultId ? snapshotItems.find((item) => String(item.itemId) === validDefaultId) : undefined,
        });
    }

    return { menuDate, selectedItems: normalizedSelected, defaultItems: normalizedDefault, snapshot };
};

export const getDailyMenu = async (req, res, next) => {
    try {
        const menuDate = dateKey(req.query.date);
        if (!menuDate) return fail(res, 'Valid menu date is required');
        const menu = await MyMealDailyMenu.findOne({ menuDate }).lean();
        return ok(res, { menu });
    } catch (error) {
        return next(error);
    }
};

export const saveDailyMenu = async (req, res, next) => {
    try {
        const menuDate = dateKey(req.body.menuDate);
        if (!menuDate) return fail(res, 'Valid menu date is required');
        const payload = await buildDailyMenuPayload({ ...req.body, menuDate });
        const menu = await MyMealDailyMenu.findOneAndUpdate(
            { menuDate },
            { $set: { ...payload, updatedBy: adminId(req) }, $setOnInsert: { createdBy: adminId(req) } },
            { new: true, upsert: true, runValidators: true },
        );
        return ok(res, { menu }, 'Daily menu saved');
    } catch (error) {
        if (error.message?.startsWith('Select')) return fail(res, error.message);
        return next(error);
    }
};

export const deleteDailyMenu = async (req, res, next) => {
    try {
        const deleted = isId(req.params.id)
            ? await MyMealDailyMenu.findByIdAndDelete(req.params.id)
            : await MyMealDailyMenu.findOneAndDelete({ menuDate: dateKey(req.params.id) });
        if (!deleted) return fail(res, 'Menu not found', 404);
        return ok(res, {}, 'Daily menu deleted');
    } catch (error) {
        return next(error);
    }
};

export const listDailyMenuHistory = async (req, res, next) => {
    try {
        const { page, limit, skip } = pagination(req.query);
        const [menus, total] = await Promise.all([
            MyMealDailyMenu.find({}).sort({ menuDate: -1 }).skip(skip).limit(limit).lean(),
            MyMealDailyMenu.countDocuments({}),
        ]);
        return ok(res, { menus, pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 } });
    } catch (error) {
        return next(error);
    }
};

export const duplicateYesterdayMenu = async (req, res, next) => {
    try {
        const targetDate = dateKey(req.query.date || req.body.menuDate);
        if (!targetDate) return fail(res, 'Valid menu date is required');
        const previous = new Date(`${targetDate}T00:00:00.000Z`);
        previous.setUTCDate(previous.getUTCDate() - 1);
        const sourceDate = previous.toISOString().slice(0, 10);
        const source = await MyMealDailyMenu.findOne({ menuDate: sourceDate }).lean();
        if (!source) return fail(res, 'No menu found for yesterday', 404);
        return ok(res, {
            sourceDate,
            menuDate: targetDate,
            selectedItems: source.selectedItems,
            defaultItems: source.defaultItems,
            snapshot: source.snapshot,
        });
    } catch (error) {
        return next(error);
    }
};

export const getMenuStats = async (_req, res, next) => {
    try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowKey = tomorrow.toISOString().slice(0, 10);
        const [activeCategories, activeItems, tomorrowMenu, totalMenus] = await Promise.all([
            MyMealMenuCategory.countDocuments({ status: true }),
            MyMealMenuItem.countDocuments({ status: true, availability: true }),
            MyMealDailyMenu.findOne({ menuDate: tomorrowKey }).lean(),
            MyMealDailyMenu.countDocuments({}),
        ]);
        return ok(res, {
            activeCategories,
            activeItems,
            tomorrowMenuReady: Boolean(tomorrowMenu),
            defaultMealConfigured: Boolean(tomorrowMenu?.defaultItems?.length),
            totalMenus,
        });
    } catch (error) {
        return next(error);
    }
};


