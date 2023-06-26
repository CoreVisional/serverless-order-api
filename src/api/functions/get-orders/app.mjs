import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

const tableName = process.env.ORDER_TABLE;

if (!tableName) {
    throw new Error("The ORDER_TABLE environment variable is not set");
}

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const fetchAllOrders = async (exclusiveStartKey = null) => {
    let params = {
        TableName: tableName,
    };

    if (exclusiveStartKey) {
        params.ExclusiveStartKey = exclusiveStartKey;
    }

    // Use Scan operator to fetch whole items from table
    const command = new ScanCommand(params);

    let data = await ddbDocClient.send(command);

    // Start with empty array if no previous data provided
    let allData = [];

    if (data.Items.length > 0) {
        allData = [...allData, ...data.Items];
    }

    // Paginate items by checking LastEvaluatedKey
    if (data.LastEvaluatedKey) {
        const nextData = await fetchAllOrders(data.LastEvaluatedKey);
        allData = [...allData, ...nextData];
    }

    return allData;
};

export const getOrders = async (event) => {
    if (event.httpMethod !== "GET") {
        throw new Error(
            `getAllItems only accept GET method, you tried: ${event.httpMethod}`
        );
    }

    try {
        const items = await fetchAllOrders();

        return {
            statusCode: 200,
            body: JSON.stringify(items),
        };
    } catch (err) {
        console.error("Failure", err.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: err.message }),
        };
    }
};
