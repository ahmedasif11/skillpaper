import mongoose from 'mongoose';

export function isValidObjectId(id: string): boolean {
  return (
    typeof id === 'string' &&
    /^[a-fA-F0-9]{24}$/.test(id) &&
    mongoose.Types.ObjectId.isValid(id)
  );
}
