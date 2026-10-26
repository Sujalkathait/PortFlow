const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function testAll() {
  const prisma = new PrismaClient();
  try {
    const userCount = await prisma.user.count();
    console.log('User count:', userCount);

    const tables = ['user', 'equipment', 'ship', 'warehouse', 'cargo', 'operation', 'truck', 'gatePass', 'customsInspection', 'bill', 'issue', 'systemLog'];
    for (const t of tables) {
      try {
        const c = await prisma[t].count();
        console.log(`Table ${t}: ${c} rows`);
      } catch (err) {
        console.log(`Table ${t}: FAILED - ${err.message.split('\n').pop()}`);
      }
    }
  } catch (err) {
    console.error('Connection failed:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

testAll();
