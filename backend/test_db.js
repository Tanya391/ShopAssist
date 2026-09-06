const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect().then(() => {
  return client.query(\CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
  );\`);
}).then(() => {
  return client.query(\CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");\`);
}).then(() => {
  console.log('User table created successfully');
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});