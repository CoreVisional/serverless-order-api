import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const tableName = process.env.ORDER_TABLE;

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const fetchAllOrders = async (allData = [], exclusiveStartKey = null) => {
    let params = {
        TableName: tableName,
        ExclusiveStartKey: exclusiveStartKey,
    };

    // Use Scan operator to fetch whole items from table
    const command = new ScanCommand(params);

    let data = await ddbDocClient.send(command);

    if (data.Items.length > 0) {
        allData = [...allData, ...data.Items];
    }

    // Paginate items by checking LastEvaluatedKey
    if (data.LastEvaluatedKey) {
        return await fetchAllOrders(allData, data.LastEvaluatedKey);
    } else {
        return data.Items;
    }
};

export const getOrders = async (event) => {
    if (event.httpMethod !== "GET") {
        throw new Error(
            `getAllItems only accept GET method, you tried: ${event.httpMethod}`
        );
    }

    let items = {};

    try {
        items = await fetchAllOrders();
    } catch (err) {
        console.log("Failure", err.message);
    }

    const response = {
        statusCode: 200,
        body: JSON.stringify(items),
    };

    return response;
};
