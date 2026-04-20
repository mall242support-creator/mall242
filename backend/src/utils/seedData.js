const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Load environment variables
dotenv.config();

// Import models
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const connectDB = require('../config/db');

// Connect to database
connectDB();

// Categories data (from your HTML)
const categories = [
  {
    name: "Bags & Luggage",
    slug: "bags-luggage",
    icon: "bi-bag",
    description: "Premium bags, backpacks, and luggage for every journey",
    displayOrder: 1,
    isActive: true,
    isFeatured: true,
    image: "https://images.unsplash.com/photo-1547949003-9792a18a2601?w=400&h=400&fit=crop",
    bannerImage: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=1200&h=400&fit=crop",
    seoTitle: "Shop Bags & Luggage | Mall242 Bahamas",
    seoDescription: "Discover premium bags, backpacks, and luggage at Mall242. Free shipping in Bahamas on orders over $50.",
  },
  {
    name: "Bikes",
    slug: "bikes",
    icon: "bi-bicycle",
    description: "Mountain bikes, road bikes, electric bikes, and accessories",
    displayOrder: 2,
    isActive: true,
    isFeatured: true,
    image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400&h=400&fit=crop",
    bannerImage: "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=1200&h=400&fit=crop",
    seoTitle: "Shop Bikes & Cycling Gear | Mall242 Bahamas",
    seoDescription: "Find the perfect bike for your lifestyle. Mountain, road, electric bikes available at Mall242.",
  },
  {
    name: "Clothes",
    slug: "clothes",
    icon: "bi-handbag",
    description: "Fashionable clothing for men, women, and children",
    displayOrder: 3,
    isActive: true,
    isFeatured: true,
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&h=400&fit=crop",
    bannerImage: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=400&fit=crop",
    seoTitle: "Shop Fashion & Clothing | Mall242 Bahamas",
    seoDescription: "Latest fashion trends for everyone. Shop dresses, shirts, jackets, and more at Mall242.",
  },
  {
    name: "Doors & Windows",
    slug: "doors-windows",
    icon: "bi-door-open",
    description: "Quality doors, windows, and home improvement products",
    displayOrder: 4,
    isActive: true,
    isFeatured: false,
    image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&h=400&fit=crop",
    bannerImage: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=1200&h=400&fit=crop",
    seoTitle: "Shop Doors & Windows | Mall242 Bahamas",
    seoDescription: "Quality doors, windows, and home improvement products for your home.",
  },
  {
    name: "Electronics & Accessories",
    slug: "electronics-accessories",
    icon: "bi-phone",
    description: "Latest electronics, gadgets, and accessories",
    displayOrder: 5,
    isActive: true,
    isFeatured: true,
    image: "https://images.unsplash.com/photo-1592899677977-9e10cb588fbe?w=400&h=400&fit=crop",
    bannerImage: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&h=400&fit=crop",
    seoTitle: "Shop Electronics & Gadgets | Mall242 Bahamas",
    seoDescription: "Latest smartphones, laptops, headphones, and accessories at best prices.",
  },
  {
    name: "Furniture",
    slug: "furniture",
    icon: "bi-house",
    description: "Beautiful furniture for every room in your home",
    displayOrder: 6,
    isActive: true,
    isFeatured: true,
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=400&fit=crop",
    bannerImage: "https://images.unsplash.com/photo-1503602642458-232111445657?w=1200&h=400&fit=crop",
    seoTitle: "Shop Furniture | Mall242 Bahamas",
    seoDescription: "Modern and classic furniture for your home. Sofas, beds, tables, and more.",
  },
  {
    name: "Mens Wear",
    slug: "mens-wear",
    icon: "bi-person",
    description: "Stylish clothing and accessories for men",
    displayOrder: 7,
    isActive: true,
    isFeatured: true,
    image: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&h=400&fit=crop",
    bannerImage: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=1200&h=400&fit=crop",
    seoTitle: "Shop Men's Fashion | Mall242 Bahamas",
    seoDescription: "Shop the latest men's fashion including shirts, pants, suits, and accessories.",
  },
  {
    name: "Shoes",
    slug: "shoes",
    icon: "bi-shoe",
    description: "Footwear for every occasion",
    displayOrder: 8,
    isActive: true,
    isFeatured: true,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop",
    bannerImage: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&h=400&fit=crop",
    seoTitle: "Shop Shoes & Footwear | Mall242 Bahamas",
    seoDescription: "Find the perfect pair of shoes for every occasion. Sneakers, formal, sandals, and more.",
  },
];

// Sample products data
const generateProducts = (categoryIds, vendorId) => {
  const products = [];
  const brands = ["Nike", "Adidas", "Apple", "Samsung", "Sony", "Gucci", "Prada", "Trek", "Samsonite"];
  
  for (let i = 1; i <= 48; i++) {
    const categoryIndex = Math.floor(Math.random() * categories.length);
    const categoryId = categoryIds[categoryIndex];
    const hasDiscount = Math.random() > 0.6;
    const originalPrice = Math.floor(Math.random() * 500) + 20;
    const discountPercent = hasDiscount ? Math.floor(Math.random() * 40) + 10 : 0;
    const finalPrice = hasDiscount ? Math.floor(originalPrice * (1 - discountPercent / 100)) : originalPrice;
    
    products.push({
      name: `${categories[categoryIndex].name} Product ${i}`,
      slug: `${categories[categoryIndex].slug}-product-${i}`.toLowerCase().replace(/\s+/g, '-'),
      description: `This premium ${categories[categoryIndex].name.toLowerCase()} product offers exceptional quality and performance. Perfect for everyday use.`,
      shortDescription: `High-quality ${categories[categoryIndex].name.toLowerCase()} product at an amazing price.`,
      price: finalPrice,
      discountedPrice: hasDiscount ? finalPrice : null,
      costPrice: originalPrice,
      quantity: Math.floor(Math.random() * 100) + 10,
      category: categoryId,
      vendor: vendorId,
      brand: brands[Math.floor(Math.random() * brands.length)],
      images: [
        {
          url: `https://picsum.photos/id/${(i % 100) + 1}/500/500`,
          isMain: true,
          alt: `${categories[categoryIndex].name} Product ${i}`,
        },
        {
          url: `https://picsum.photos/id/${(i % 100) + 2}/500/500`,
          isMain: false,
          alt: `${categories[categoryIndex].name} Product ${i} - View 2`,
        },
        {
          url: `https://picsum.photos/id/${(i % 100) + 3}/500/500`,
          isMain: false,
          alt: `${categories[categoryIndex].name} Product ${i} - View 3`,
        },
      ],
      features: [
        "Premium quality materials",
        "Durable and long-lasting",
        "Satisfaction guaranteed",
        "Free shipping on orders over $50",
      ],
      isActive: true,
      isFeatured: i <= 12,
      isPrime: Math.random() > 0.7,
      isApproved: true,
      seoTitle: `${categories[categoryIndex].name} Product ${i} | Mall242 Bahamas`,
      seoDescription: `Shop ${categories[categoryIndex].name} Product ${i} at Mall242. Best price in Bahamas. Free shipping available.`,
      tags: [categories[categoryIndex].name.toLowerCase(), brands[Math.floor(Math.random() * brands.length)].toLowerCase(), "premium"],
    });
  }
  
  return products;
};

// Admin user data
const createAdminUser = async () => {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@mall242.com';
  const existingAdmin = await User.findOne({ email: adminEmail });
  
  if (existingAdmin) {
    console.log('Admin user already exists');
    return existingAdmin;
  }
  
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123456';
  
  const admin = await User.create({
    name: process.env.ADMIN_NAME || 'Super Admin',
    email: adminEmail,
    password: adminPassword,
    role: 'admin',
    isActive: true,
    isEmailVerified: true,
    referralCode: 'ADMIN123',
    vipStatus: true,
    earlyAccessGranted: true,
  });
  
  console.log(`Admin user created: ${admin.email}`);
  return admin;
};

// Seed database
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Clear existing data (optional - comment out if you want to keep data)
    await Category.deleteMany({});
    await Product.deleteMany({});
    console.log('Cleared existing categories and products');
    
    // Insert categories
    const insertedCategories = await Category.insertMany(categories);
    console.log(`✅ Inserted ${insertedCategories.length} categories`);
    
    // Get category IDs
    const categoryIds = insertedCategories.map(cat => cat._id);
    
    // Create admin user (to use as vendor for products)
    const admin = await createAdminUser();
    console.log(`✅ Admin user ready: ${admin.email}`);
    
    // Generate and insert products with admin as vendor
    const products = generateProducts(categoryIds, admin._id);
    const insertedProducts = await Product.insertMany(products);
    console.log(`✅ Inserted ${insertedProducts.length} products`);
    
    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Categories: ${insertedCategories.length}`);
    console.log(`   - Products: ${insertedProducts.length}`);
    console.log(`   - Admin User: ${admin.email}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

// Run seed if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, categories, generateProducts };