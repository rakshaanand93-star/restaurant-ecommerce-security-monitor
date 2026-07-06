export async function syncToMongo(collectionName: string, data: any): Promise<boolean> {
  try {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
    const response = await fetch(`${backendUrl}/api/mongodb/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ collectionName, data }),
    });

    if (!response.ok) {
      console.error(`MongoDB Sync Error for ${collectionName}:`, await response.text());
      return false;
    } else {
      console.log(`Synced to MongoDB [${collectionName}] successfully.`);
      return true;
    }
  } catch (error) {
    console.error(`Failed to sync to MongoDB [${collectionName}]:`, error);
    return false;
  }
}
