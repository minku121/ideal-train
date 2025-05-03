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
  
  // Create user settings with UPI IDs
  await createUserSettings(userAdmin.id, 'admin123@upi');
  await createUserSettings(userBuyer1.id, 'buyer1@upi');
  await createUserSettings(userBuyer2.id, 'buyer2@upi');
  await createUserSettings(userSeller.id, 'seller@upi');
  await createUserSettings(userMediator1.id, 'mediator1@upi');
  await createUserSettings(userMediator2.id, 'mediator2@upi');
  
  console.log('Created user settings with UPI payment information');
  
  // Create brands
  const brandApple = await createBrand('Apple');
  const brandSamsung = await createBrand('Samsung');
  const brandNike = await createBrand('Nike');
  
  console.log('Created brands');
  
  // Create brand managers (mediators assigned to brands)
  const managerApple = await createBrandManager(brandApple.id, userMediator1.id);
  const managerSamsung = await createBrandManager(brandSamsung.id, userMediator1.id);
  const managerNike = await createBrandManager(brandNike.id, userMediator2.id);
  
  console.log('Created brand managers');
  
  // Create products for each brand
  const appleProduct = await createProduct('iPhone 14 Pro', brandApple.id, managerApple.id, 'ORIGINAL', 'RATING_DEAL', 10.5);
  const samsungProduct = await createProduct('Galaxy S22', brandSamsung.id, managerSamsung.id, 'ORIGINAL', 'RATING_DEAL', 8.0);
  const nikeProduct = await createProduct('Air Jordan', brandNike.id, managerNike.id, 'ORIGINAL', 'RATING_DEAL', 5.0);
  
  console.log('Created products');
  
  // Create orders with UPI payment information
  // Order 1 - Submitted status with UPI payment
  const order1 = await createOrder(
    'ORD-2023-001', 
    userBuyer1.id, 
    brandApple.id, 
    managerApple.id, 
    'SUBMITTED', 
    subtractDays(new Date(), 2),
    null,
    'buyer1@upi'
  );
  
  // Order 2 - Approved status with UPI payment
  const order2 = await createOrder(
    'ORD-2023-002', 
    userBuyer2.id, 
    brandSamsung.id, 
    managerSamsung.id, 
    'APPROVED', 
    subtractDays(new Date(), 5),
    null,
    'buyer2@upi'
  );
  
  // Order 3 - Rejected status with notes and UPI payment
  const order3 = await createOrder(
    'ORD-2023-003', 
    userBuyer1.id, 
    brandNike.id, 
    managerNike.id, 
    'REJECTED', 
    subtractDays(new Date(), 7), 
    'Screenshots do not match the product. Please resubmit with correct screenshots.',
    'buyer1@upi'
  );
  
  console.log('Created orders with UPI payment information');
  
  // Add products to orders
  await addProductToOrder(order1.id, appleProduct.id);
  await addProductToOrder(order2.id, samsungProduct.id);
  await addProductToOrder(order3.id, nikeProduct.id);
  
  console.log('Added products to orders');
  
  // Add order screenshots
  const screenshotBase = 'https://storage.example.com/screenshots/';
  
  await createOrderScreenshot(order1.id, appleProduct.id, `${screenshotBase}iphone-order-${order1.id}.jpg`);
  await createOrderScreenshot(order2.id, samsungProduct.id, `${screenshotBase}galaxy-s22-order-${order2.id}.jpg`);
  await createOrderScreenshot(order3.id, nikeProduct.id, `${screenshotBase}air-jordan-order-${order3.id}.jpg`);
  
  console.log('Added order screenshots');
  
  // Create some log entries
  await createLog('INFO', 'User login successful', 'auth', userAdmin.id, { ip: '192.168.1.1', device: 'Desktop - Chrome' });
  await createLog('INFO', 'Order created with UPI', 'orders', userBuyer1.id, { 
    orderId: order1.orderId, 
    upiId: 'buyer1@upi' 
  });
  await createLog('INFO', 'UPI Payment received', 'payment', userBuyer2.id, { 
    orderId: order2.orderId, 
    amount: 20.0, 
    upiId: 'buyer2@upi', 
    transactionId: 'UPI123456789' 
  });
  
  console.log('Created log entries');
  console.log('Seed completed successfully!');
}

// Helper functions
async function clearDatabase() {
  // Delete in reverse order of dependencies
  await prisma.appLog.deleteMany({});
  await prisma.orderScreenshot.deleteMany({});
  await prisma.orderProduct.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.brandManager.deleteMany({});
  await prisma.brand.deleteMany({});
  await prisma.userSettings.deleteMany({});
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

async function createUserSettings(userId, upiId) {
  return prisma.userSettings.create({
    data: {
      userId,
      upiId
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

async function createOrder(
  orderId, 
  buyerId, 
  brandId, 
  brandManagerId, 
  status = 'SUBMITTED', 
  dateOfOrder = new Date(),
  exchangeNotes = null,
  upiId = null
) {
  return prisma.order.create({
    data: {
      orderId,
      dateOfOrder,
      buyerId,
      brandId,
      brandManagerId,
      orderProofStatus: status,
      exchangeNotes,
      upiId,
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

async function createLog(level, message, source = null, userId = null, metadata = null) {
  return prisma.appLog.create({
    data: {
      level,
      message,
      source,
      userId,
      metadata
    }
  });
}

// Utility function to subtract days from a date
function subtractDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
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