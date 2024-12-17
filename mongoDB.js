const { MongoClient } = require('mongodb');
const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function runMongoDBTest() {
    try {
      await client.connect();
      const db = client.db('testDB');
      
      const taskPriorities = db.collection('taskPriorities');
      const taskTypes = db.collection('taskTypes');
      const taskStatuses = db.collection('taskStatuses');
      const tasks = db.collection('tasks');
      
      // Тест 1: Вставка даних у кілька колекцій
      console.time('MongoDB Bulk Insert');
      
      await taskPriorities.insertMany([
        { priority_name: 'High' },
        { priority_name: 'Medium' },
        { priority_name: 'Low' }
      ]);
      
      await taskTypes.insertMany([
        { type_name: 'Bug' },
        { type_name: 'Feature' },
        { type_name: 'Improvement' }
      ]);
      
      await taskStatuses.insertMany([
        { status_name: 'To Do' },
        { status_name: 'In Progress' },
        { status_name: 'Completed' }
      ]);
      
      await tasks.insertOne({
        project_id: 1,
        title: 'Fix Login Bug',
        description: 'Login button is unresponsive',
        status_id: 1,
        priority_id: 1,
        type_id: 1,
        assigned_to: 2
      });
      
      console.timeEnd('MongoDB Bulk Insert');
      
      // Тест 2: Складний запит SELECT з агрегуванням
      console.time('MongoDB Complex Find');
        const result = await tasks.aggregate([
        {
            $lookup: {
            from: 'taskPriorities',
            localField: 'priority_id',
            foreignField: '_id',
            as: 'priority'
            }
        },
        {
            $lookup: {
            from: 'taskTypes',
            localField: 'type_id',
            foreignField: '_id',
            as: 'type'
            }
        },
        {
            $lookup: {
            from: 'taskStatuses',
            localField: 'status_id',
            foreignField: '_id',
            as: 'status'
            }
        },
        {
            $unwind: {
            path: '$priority',
            preserveNullAndEmptyArrays: true
            },
        },
        {
            $unwind: {
            path: '$type',
            preserveNullAndEmptyArrays: true
            },
        },
        {
            $unwind: {
            path: '$status',
            preserveNullAndEmptyArrays: true
            },
        },
        {
            $project: {
            title: 1,
            description: 1,
            'priority.priority_name': 1,
            'type.type_name': 1,
            'status.status_name': 1
            }
        }
        ]).toArray();

        console.log(result);

      
      console.timeEnd('MongoDB Complex Find');
      console.log(result);
      
      // Тест 3: Оновлення даних
      console.time('MongoDB Update');
      await tasks.updateOne(
        { project_id: 1, title: 'Fix Login Bug' },
        { $set: { status_id: 2 } }
      );
      console.timeEnd('MongoDB Update');
      
      // Тест 4: Видалення даних
      console.time('MongoDB Delete');
      await tasks.deleteOne({ project_id: 1, title: 'Fix Login Bug' });
      console.timeEnd('MongoDB Delete');
      
    } catch (err) {
      console.error('Error executing query', err.stack);
    } finally {
        await clearMongoDB().catch(console.error);
        await client.close();
    }
}

async function clearMongoDB() {
    const db = client.db('testDB');
    
    const collections = await db.listCollections().toArray();
    for (const collection of collections) {
      await db.collection(collection.name).deleteMany({});
    }
  
    console.log('MongoDB database cleared successfully');
  }

runMongoDBTest().catch(console.error);
