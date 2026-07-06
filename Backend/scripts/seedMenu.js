import { connectDB, disconnectDB } from '../src/config/db.js';
import { seedCategories } from './seeders/categorySeeder.js';
import { seedItems } from './seeders/itemSeeder.js';
import { seedTodaysMenu } from './seeders/todaysMenuSeeder.js';

async function runSeeders() {
    try {
        console.log('Connecting to database...');
        await connectDB();
        console.log('Database connected.\n');

        console.log('--- Starting Menu Management Seeder ---\n');

        await seedCategories();
        await seedItems();
        await seedTodaysMenu();

        console.log('\n--- Seeding Completed Successfully ---');

    } catch (error) {
        console.error('Seeding failed:', error);
    } finally {
        await disconnectDB();
        console.log('Database disconnected.');
        process.exit(0);
    }
}

runSeeders();
