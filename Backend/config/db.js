const mongoose = require("mongoose");
const colors = require("colors");

//  Connect with the database

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(
      `Successfully connected with the database of PORT: ${mongoose.connection.host}`
        .bgGreen,
    );

    await mongoose.connection.syncIndexes();

    console.log("Indexes synced".bgMagenta);
  } catch (error) {
    console.log("DB Error: ", error, colors.bgRed);
  }
};

module.exports = connectDB;
