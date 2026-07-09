import mongoose from 'mongoose';

// Register dummy FoodRestaurant model if not exists to prevent populate errors (legacy support)
if (!mongoose.models.FoodRestaurant) {
    mongoose.model('FoodRestaurant', new mongoose.Schema({
        restaurantName: String,
        slug: String,
        zoneId: mongoose.Schema.Types.ObjectId
    }, { collection: 'food_restaurants' }));
}

const foodHeroBannerSchema = new mongoose.Schema(
    {
        imageUrl: {
            type: String,
            required: true
        },
        publicId: {
            type: String,
            required: true
        },
        title: {
            type: String
        },
        ctaText: {
            type: String
        },
        ctaLink: {
            type: String
        },
        linkedRestaurantIds: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: 'FoodRestaurant',
            default: []
        },
        sortOrder: {
            type: Number,
            default: 0,
            index: true
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true
        }
    },
    {
        collection: 'food_hero_banners',
        timestamps: true
    }
);

foodHeroBannerSchema.index({ isActive: 1, sortOrder: 1 });

export const FoodHeroBanner = mongoose.model('FoodHeroBanner', foodHeroBannerSchema);

