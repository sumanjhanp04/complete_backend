// scripts/reset-storage.ts
import { MongoClient } from 'mongodb';
import { config } from 'dotenv';

config(); // Load environment variables

const DEFAULT_STORAGE = 1024 * 1024 * 1024; // 1GB in bytes

async function resetStorage() {
  const mongoUri = process.env.MONGODB_URI;
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();


    // Reset users' storage in Auth service database
    const authDb = client.db('pasdtems'); // replace with your auth db name
    const usersCollection = authDb.collection('users');

    const userUpdateResult = await usersCollection.updateMany(
      {}, // match all documents
      {
        $set: {
          allocatedSpace: DEFAULT_STORAGE,
        },
      },
    );


    `Updated ${userUpdateResult.modifiedCount} users' storage allocation`,
    );

    // Delete all files from Files service database
    const filesDb = client.db('files_service_db'); // replace with your files db name
    const filesCollection = filesDb.collection('files');

    const filesDeleteResult = await filesCollection.deleteMany({});


    // Optional: Delete physical files from storage
    // This depends on your storage solution (S3, local filesystem, etc.)


  } catch (error) {
    console.error('Error during storage reset:', error);
  } finally {
    await client.close();

  }
}

resetStorage().catch(console.error);
