const { MongoClient } = require('mongodb');

// MongoDB 连接 URI（默认 Rocket.Chat 使用 "rocketchat" 数据库）
const uri = "mongodb://localhost:3001/meteor";

async function queryData() {
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log("成功连接到 MongoDB");

        const db = client.db();
        // const collections = await db.listCollections().toArray();
        // console.log("集合列表:", collections.map(c => c.name));
        // 示例 1：查询所有用户
        // const users = await db.collection('users').find().limit(5).toArray();
        // console.log("前 5 个用户:", users);

        // 示例 2：查询所有频道（rooms）
        // const rooms = await db.collection('rocketchat_room').find().limit(5).toArray();
        // console.log("前 5 个频道:", rooms);

        // 示例 3：查询特定用户的消息
        const messages = await db.collection('rocketchat_message').find({
            // 'u.username': 'admin'  // 查询用户名为 "admin" 的消息
            msg: "诸侯会盟" 
        }).limit(5).toArray();
        console.log(messages);

    } catch (err) {
        console.error("MongoDB 查询出错:", err);
    } finally {
        await client.close();
    }
}

queryData();