/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { connect, disconnect } from 'mongoose';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

import { UserRole, UserSchema } from '../schemas/user.schema';
import { ProductSchema } from '../schemas/product.schema';
import { hash } from 'bcryptjs';

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce';

async function seed() {
  try {
    console.log('🌱 Starting database seeding...');
    await connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const UserModel =
      mongoose.models.User || mongoose.model('User', UserSchema);
    const ProductModel =
      mongoose.models.Product || mongoose.model('Product', ProductSchema);

    await UserModel.deleteMany({});
    await ProductModel.deleteMany({});
    console.log('🗑️  Cleared existing data');

    const adminPassword: string = await hash('Admin123!', 10);
    const admin = await UserModel.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: adminPassword,
      role: UserRole.ADMIN,
    });
    console.log(
      '👤 Created admin user: admin@example.com (password: Admin123!)',
    );

    const userPassword: string = await hash('User123!', 10);
    const user = await UserModel.create({
      name: 'John Doe',
      email: 'user@example.com',
      password: userPassword,
      role: UserRole.USER,
    });
    console.log(
      '👤 Created regular user: user@example.com (password: User123!)',
      user,
    );

    const products = [
      {
        name: 'Wireless Headphones',
        description:
          'Premium wireless headphones with active noise cancellation',
        price: 299.99,
        stock: 50,
        category: 'Electronics',
        images: ['https://via.placeholder.com/300'],
        createdBy: admin._id,
      },
      {
        name: 'Smart Watch',
        description: 'Feature-rich smartwatch with health tracking',
        price: 399.99,
        stock: 30,
        category: 'Electronics',
        images: ['https://via.placeholder.com/300'],
        createdBy: admin._id,
      },
      {
        name: 'Laptop Backpack',
        description: 'Durable laptop backpack with multiple compartments',
        price: 79.99,
        stock: 100,
        category: 'Accessories',
        images: ['https://via.placeholder.com/300'],
        createdBy: admin._id,
      },
      {
        name: 'USB-C Cable',
        description: 'High-speed USB-C charging cable - 6ft',
        price: 19.99,
        stock: 200,
        category: 'Accessories',
        images: ['https://via.placeholder.com/300'],
        createdBy: admin._id,
      },
      {
        name: 'Wireless Mouse',
        description: 'Ergonomic wireless mouse with precision tracking',
        price: 49.99,
        stock: 75,
        category: 'Electronics',
        images: ['https://via.placeholder.com/300'],
        createdBy: admin._id,
      },
      {
        name: 'Mechanical Keyboard',
        description: 'RGB mechanical keyboard with cherry MX switches',
        price: 149.99,
        stock: 40,
        category: 'Electronics',
        images: ['https://via.placeholder.com/300'],
        createdBy: admin._id,
      },
      {
        name: 'Desk Lamp',
        description: 'LED desk lamp with adjustable brightness',
        price: 39.99,
        stock: 60,
        category: 'Home & Office',
        images: ['https://via.placeholder.com/300'],
        createdBy: admin._id,
      },
      {
        name: 'Water Bottle',
        description: 'Insulated stainless steel water bottle - 32oz',
        price: 24.99,
        stock: 150,
        category: 'Home & Office',
        images: ['https://via.placeholder.com/300'],
        createdBy: admin._id,
      },
      {
        name: 'Notebook Set',
        description: 'Premium notebook set with dotted pages',
        price: 14.99,
        stock: 120,
        category: 'Stationery',
        images: ['https://via.placeholder.com/300'],
        createdBy: admin._id,
      },
      {
        name: 'Phone Stand',
        description: 'Adjustable phone stand for desk',
        price: 12.99,
        stock: 90,
        category: 'Accessories',
        images: ['https://via.placeholder.com/300'],
        createdBy: admin._id,
      },
    ];

    await ProductModel.insertMany(products);
    console.log(`📦 Created ${products.length} sample products`);

    console.log('\n✨ Database seeding completed successfully!');
    console.log('\n📝 Sample Credentials:');
    console.log('Admin: admin@example.com / Admin123!');
    console.log('User: user@example.com / User123!');

    await disconnect();
    console.log('👋 Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

void seed();
