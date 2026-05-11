import mongoose from 'mongoose';

export const connectMongoose = async (mongoUrl: string): Promise<void> => {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  await mongoose.connect(mongoUrl);
};

export const disconnectMongoose = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
};
