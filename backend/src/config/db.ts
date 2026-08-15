import mongoose from 'mongoose';
import { seedTemplatesIfEmpty } from '../scripts/seedTemplatesIfEmpty';

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/skillpaper';

  try {
    await mongoose.connect(uri);
    console.log('MongoDB Connected');
    await seedTemplatesIfEmpty();
  } catch (err) {
    console.error('MongoDB Connection Failed', err);
    process.exit(1);
  }
};

export default connectDB;
