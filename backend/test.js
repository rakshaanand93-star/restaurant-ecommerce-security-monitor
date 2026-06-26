const { MongoClient } = require("mongodb");

const uri = "mongodb+srv://rakshaanand93_db_user:Raksha1234@cluster0.h8umcko.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

async function run() {
  try {
    console.log("Trying to connect...");

    const client = new MongoClient(uri);

    await client.connect();

    console.log("✅ CONNECTED TO MONGODB!");

    await client.close();

    console.log("✅ CONNECTION CLOSED");
  } catch (err) {
    console.error("❌ CONNECTION ERROR:");
    console.error(err);
  }
}

run();