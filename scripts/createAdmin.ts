import bcrypt from 'bcrypt';
import { db } from '../server/db';
import { users } from '../server/db/schema';

const password = await bcrypt.hash('12345678', 10); ;
await db.insert(users).values({
  name: 'admin',
  password,
});
console.log(`Created default admin user. \nLogin: 'admin' \nPassword: '${password}'`);
