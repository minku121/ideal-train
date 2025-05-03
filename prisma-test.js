// prisma-test.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPrisma() {
  try {
    console.log('Available models in Prisma Client:');
    
    // Print all properties of prisma
    for (const key in prisma) {
      if (!key.startsWith('$') && typeof prisma[key] !== 'function') {
        console.log(`- ${key}`);
      }
    }
    
    // Try to directly access the model
    console.log('Direct access check:');
    console.log('OrderScreenshot model exists:', prisma.orderScreenshot !== undefined);
    console.log('Order model exists:', prisma.order !== undefined);
    console.log('Product model exists:', prisma.product !== undefined);
    
    // Try to reference a model by string
    const dmmf = prisma._dmmf;
    if (dmmf && dmmf.modelMap) {
      console.log('Models from DMMF:');
      for (const modelName in dmmf.modelMap) {
        console.log(`- ${modelName}`);
      }
    }
  } catch (e) {
    console.error('Error testing Prisma:', e);
  } finally {
    await prisma.$disconnect();
  }
}

testPrisma()
  .catch(e => {
    console.error(e);
    process.exit(1);
  }); 