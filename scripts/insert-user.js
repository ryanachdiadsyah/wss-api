const { PrismaClient } = require('@prisma/client');
const readline = require('readline');
const md5 = require('md5');
const { randomBytes } = require('crypto');

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  try {
    const username = await askQuestion('Username: ');
    const password = await askQuestion('Password: ');
    const validUntilInput = await askQuestion('Valid Until (YYYY-MM-DD): ');
    const maxSession = await askQuestion('Max Session: ');


    const valid_until = new Date(validUntilInput);
    const hashedPassword = md5(password);
    
    valid_until.setHours(23, 59, 59, 999);

    const newUser = await prisma.users.create({
      data: {
        username,
        password: hashedPassword,
        valid_until,
        maxSession: parseInt(maxSession, 10),
        is_active: true,
        api_key: randomBytes(10).toString('hex'),
      }
    });

    console.log('✅ User berhasil ditambahkan:', newUser);
  } catch (error) {
    console.error('❌ Gagal menambahkan user:', error);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

main();
