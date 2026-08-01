const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

async function main() {
  // Seed Admin user
  const adminUser = await prisma.user.findUnique({
    where: { email: 'admin@fuera.com' }
  });
  if (!adminUser) {
    const adminPassword = hashPassword('admin12345');
    await prisma.user.create({
      data: {
        email: 'admin@fuera.com',
        password: adminPassword,
        name: 'Admin User',
        role: 'ADMIN'
      }
    });
    console.log('Seed: Admin user created (admin@fuera.com / admin12345)');
  } else {
    console.log('Seed: Admin user already exists');
  }

  // Seed Viewer user
  const viewerUser = await prisma.user.findUnique({
    where: { email: 'user@fuera.in.net' }
  });
  if (!viewerUser) {
    const viewerPassword = hashPassword('user@123');
    await prisma.user.create({
      data: {
        email: 'user@fuera.in.net',
        password: viewerPassword,
        name: 'Viewer User',
        role: 'VIEWER'
      }
    });
    console.log('Seed: Viewer user created (user@fuera.in.net / user@123)');
  } else {
    console.log('Seed: Viewer user already exists');
  }

  // Check if company settings exist
  const existingSettings = await prisma.companySetting.findUnique({
    where: { id: 'default' }
  });
  if (!existingSettings) {
    await prisma.companySetting.create({
      data: {
        id: 'default',
        companyName: 'FUERA',
        address: '123 Business Center, Suite 100, City, State, PIN-000000',
        gstin: '27AAAAA1111A1Z1',
        pan: 'AAAAA1111A',
        cin: 'L00000MH2026PLC000000',
        bankName: 'FUERA Bank',
        accountNumber: '999912345678',
        ifscCode: 'FRAB0001234',
        defaultTerms: '1. Payments are due within 15 days of invoice date.\n2. Interest of 2% per month will be charged on overdue payments.\n3. Goods once sold cannot be taken back.',
        invoicePrefix: 'INV-',
        quotationPrefix: 'QTN-'
      }
    });
    console.log('Seed: Default Company Settings created');
  } else {
    console.log('Seed: Company Settings already exist, skipping settings creation');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
