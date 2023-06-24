import { v4 as uuidv4 } from "uuid";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const region = process.env.AWS_REGION;
const client = new DynamoDBClient({ region: region });
const dynamoDb = DynamoDBDocumentClient.from(client);

const ordersTable = "order-table";

const getCurrentDate = () => {
    let date_ob = new Date();
    let date = ("0" + date_ob.getDate()).slice(-2);
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    let year = date_ob.getFullYear();
    let hours = date_ob.getHours();
    let minutes = date_ob.getMinutes();
    let seconds = date_ob.getSeconds();

    return `${year}-${month}-${date}T${hours}:${minutes}:${seconds}`;
};

async function initData(dynamoDb) {
    let formattedDateNow = getCurrentDate();

    let order1 = {
        user_id: "static_user",
        id: uuidv4(),
        restaurantId: "Restaurant 1",
        name: "Doner Kebap",
        orderStatus: "PENDING",
        createdAt: formattedDateNow.toString(),
        quantity: 2,
    };

    try {
        const command = new PutCommand({
            TableName: ordersTable,
            Item: order1,
        });
        await dynamoDb.send(command);
    } catch (err) {
        console.log(err);
    }

    let order2 = {
        user_id: "static_user",
        id: uuidv4(),
        restaurantId: "Restaurant 1",
        name: "Spaghetti",
        orderStatus: "PENDING",
        createdAt: formattedDateNow.toString(),
        quantity: 3,
    };

    try {
        const command = new PutCommand({
            TableName: ordersTable,
            Item: order2,
        });
        await dynamoDb.send(command);
    } catch (err) {
        console.log(err);
    }

    let order3 = {
        user_id: "static_user",
        id: uuidv4(),
        restaurantId: "Restaurant 2",
        name: "Beef",
        orderStatus: "PENDING",
        createdAt: formattedDateNow.toString(),
        quantity: 2,
    };

    try {
        const command = new PutCommand({
            TableName: ordersTable,
            Item: order3,
        });
        await dynamoDb.send(command);
    } catch (err) {
        console.log(err);
    }
}

initData(dynamoDb);
console.log("Done seeding Order table with sample Orders");
