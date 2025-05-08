// scripts/insert-user.ts
import { PrismaClient } from '@prisma/client';
import readline from 'readline';
import md5 from 'md5';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const ask = (question: string): Promise<string> => {
    return new Promise(resolve => rl.question(question, resolve));
};

(async () => {
    try {
        const username = await ask('Username: ');
        const password = await ask('Password (plain): ');
        const validUntil = await ask('Valid until (YYYY-MM-DD): ');
        const maxSession = await ask('Max session: ');

        const user = await prisma.users.create({
            data: {
                username,
                password: md5(password),
                valid_until: new Date(validUntil),
                maxSession: parseInt(maxSession, 10),
                is_active: true,
                api_key: randomBytes(16).toString('hex')
            },
        });

        console.log('User created:', user);
    } catch (error) {
        console.error('Error inserting user:', error);
    } finally {
        rl.close();
        await prisma.$disconnect();
    }
})();
