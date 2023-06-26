import dayjs from "dayjs";
import { v4 as uuidv4 } from "uuid";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const tableName = process.env.ORDER_TABLE;
const DEFAULT_ORDER_STATUS = "PENDING";

const getCurrentDate = () => {
    return dayjs().format("YYYY-MM-DDTHH:mm:ss");
};

export const postOrders = async (event) => {
    let formattedDateNow = getCurrentDate();
    const { body } = event;
    let parsedBody = JSON.parse(body);

    // The item that contains fully order Item.
    let item = {
        user_id: "static_user",
        id: uuidv4(),
        name: parsedBody.name,
        restaurantId: parsedBody.restaurantId,
        quantity: parsedBody.quantity,
        createdAt: formattedDateNow.toString(),
        orderStatus: DEFAULT_ORDER_STATUS,
    };

    let params = {
        TableName: tableName,
        Item: item,
    };

    try {
        const command = new PutCommand(params);
        const data = await docClient.send(command);
        console.log("Success for putting Item");
        console.log(data);
    } catch (err) {
        console.log("Failure", err.message);
    }
    const response = {
        statusCode: 200,
        body: JSON.stringify(item),
    };
    return response;
};
