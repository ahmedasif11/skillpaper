import dotenv from 'dotenv';
import path from 'path';
import connectDB from './config/db';
import { assertJwtSecretConfigured } from './config/jwt';
import { startParseWorker } from './container';
import app from './app';

dotenv.config({ path: path.join(__dirname, '..', '.env') });
assertJwtSecretConfigured();
connectDB();
startParseWorker();

const PORT = process.env.PORT || 5000;
app.listen(Number(PORT), '0.0.0.0', () =>
  console.log(`Server running on ${PORT}`)
);
