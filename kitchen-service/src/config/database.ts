import mongoose from "mongoose";

export const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri =
      process.env.MONGODB_URL || "mongodb://localhost:27017/kitchen-db";

    await mongoose.connect(mongoUri);

    console.log("✅ Conectado a MongoDB - Kitchen Service");

    mongoose.connection.on("error", (err) => {
      console.error("❌ Error en MongoDB:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("⚠️ MongoDB desconectado");
    });
  } catch (error) {
    console.error("❌ Error conectando a MongoDB:", error);
    process.exit(1);
  }
};
