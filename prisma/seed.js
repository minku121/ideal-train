// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed process...');

  // Clear existing data
  await clearDatabase();
  
  // Create users with different roles
  const userAdmin = await createUser('Admin User', 'admin@example.com', 'admin123', 'ADMIN');
  const userBuyer1 = await createUser('Buyer One', 'buyer1@example.com', 'buyer123', 'BUYER');
  const userBuyer2 = await createUser('Buyer Two', 'buyer2@example.com', 'buyer123', 'BUYER');
  const userSeller = await createUser('Seller User', 'seller@example.com', 'seller123', 'SELLER');
  const userMediator1 = await createUser('Mediator One', 'mediator1@example.com', 'mediator123', 'MEDIATOR');
  const userMediator2 = await createUser('Mediator Two', 'mediator2@example.com', 'mediator123', 'MEDIATOR');
  
  console.log('Created users with different roles');
  
  // Create brands
  const brandApple = await createBrand('Apple');
  const brandSamsung = await createBrand('Samsung');
  const brandNike = await createBrand('Nike');
  const brandAdidas = await createBrand('Adidas');
  
  console.log('Created brands');
  
  // Create brand managers (mediators assigned to brands)
  const managerApple = await createBrandManager(brandApple.id, userMediator1.id);
  const managerSamsung = await createBrandManager(brandSamsung.id, userMediator1.id);
  const managerNike = await createBrandManager(brandNike.id, userMediator2.id);
  const managerAdidas = await createBrandManager(brandAdidas.id, userMediator2.id);
  
  console.log('Created brand managers');
  
  // Create products for each brand with different deal types
  // Apple products
  await createProduct('iPhone 14 Pro', brandApple.id, managerApple.id, 'ORIGINAL', 'RATING_DEAL', 10.5);
  await createProduct('MacBook Air M2', brandApple.id, managerApple.id, 'EXCHANGE', 'REVIEW_DEAL', 15.0, 'Need old MacBook');
  await createProduct('iPad Pro', brandApple.id, managerApple.id, 'EMPTY', 'ORDER_ONLY_DEAL');
  
  // Samsung products
  await createProduct('Galaxy S22', brandSamsung.id, managerSamsung.id, 'ORIGINAL', 'RATING_DEAL', 8.0);
  await createProduct('Galaxy Tab S8', brandSamsung.id, managerSamsung.id, 'EXCHANGE', 'REVIEW_DEAL', 12.0, 'Need old tablet');
  
  // Nike products
  await createProduct('Air Jordan', brandNike.id, managerNike.id, 'ORIGINAL', 'RATING_DEAL', 5.0);
  await createProduct('Running Shoes', brandNike.id, managerNike.id, 'EMPTY', 'ORDER_ONLY_DEAL');
  
  // Adidas products
  await createProduct('Ultraboost', brandAdidas.id, managerAdidas.id, 'ORIGINAL', 'REVIEW_DEAL', 7.5);
  
  console.log('Created products');
  
  // Create some sample orders
  const order1 = await createOrder('ORD-2023-001', userBuyer1.id, brandApple.id, managerApple.id);
  const order2 = await createOrder('ORD-2023-002', userBuyer2.id, brandSamsung.id, managerSamsung.id);
  const order3 = await createOrder('ORD-2023-003', userBuyer1.id, brandNike.id, managerNike.id);
  
  console.log('Created orders');
  
  // Add products to orders
  await addProductToOrder(order1.id, 1); // iPhone to order 1
  await addProductToOrder(order1.id, 2); // MacBook to order 1
  await addProductToOrder(order2.id, 4); // Galaxy S22 to order 2
  await addProductToOrder(order3.id, 6); // Air Jordan to order 3
  
  console.log('Added products to orders');
  
  // Add sample order screenshots
  await createOrderScreenshot(order1.id, 1, 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg');
  await createOrderScreenshot(order2.id, 4, 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg');
  
  console.log('Added order screenshots');
  
  console.log('Seed completed successfully!');
}

// Helper functions
async function clearDatabase() {
  // Delete in reverse order of dependencies
  await prisma.orderScreenshot.deleteMany({});
  await prisma.orderProduct.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.brandManager.deleteMany({});
  await prisma.brand.deleteMany({});
  await prisma.user.deleteMany({});
  
  console.log('Database cleared');
}

async function createUser(name, email, password, role) {
  const hashedPassword = await bcrypt.hash(password, 10);
  return prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role
    }
  });
}

async function createBrand(name) {
  return prisma.brand.create({
    data: { name }
  });
}

async function createBrandManager(brandId, userId) {
  return prisma.brandManager.create({
    data: {
      brandId,
      userId
    }
  });
}

async function createProduct(name, brandId, managerId, dealType, campaignType, commission = null, exchangeNotes = null) {
  return prisma.product.create({
    data: {
      name,
      brandId,
      managerId,
      dealType,
      campaignType,
      commission,
      exchangeNotes
    }
  });
}

async function createOrder(orderId, buyerId, brandId, brandManagerId) {
  return prisma.order.create({
    data: {
      orderId,
      dateOfOrder: new Date(),
      buyerId,
      brandId,
      brandManagerId,
      orderProofStatus: 'SUBMITTED'
    }
  });
}

async function addProductToOrder(orderId, productId) {
  return prisma.orderProduct.create({
    data: {
      orderId,
      productId
    }
  });
}

async function createOrderScreenshot(orderId, productId, screenshotUrl) {
  return prisma.orderScreenshot.create({
    data: {
      orderId,
      productId,
      screenshotUrl
    }
  });
}

// Run the seed function
main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    // Close Prisma client connection
    await prisma.$disconnect();
  }); 