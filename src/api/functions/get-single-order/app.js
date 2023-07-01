import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

const tableName = process.env.ORDER_TABLE;

if (!tableName) {
    throw new Error("The ORDER_TABLE environment variable is not set");
}

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

export const getOrderById = async (event) => {
    if (event.httpMethod !== "GET") {
        return {
            statusCode: 400,
            body: `getOrderById only accept GET method, you tried: ${event.httpMethod}`,
        };
    }

    const orderId = event.pathParameters.orderId;

    if (!orderId) {
        return {
            statusCode: 400,
            body: "Missing orderId",
        };
    }

    const get_item = {
        user_id:
            event.requestContext.authorizer.claims["cognito:username"] ||
            event.requestContext.authorizer.claims.username, // Lambda proxy from AWS ApiGateway will directly pass the cognito username.
        id: orderId,
    };

    const params = {
        TableName: tableName,
        Key: get_item,
    };

    const command = new GetCommand(params);

    try {
        const data = await ddbDocClient.send(command);
        return {
            statusCode: 200,
            body: JSON.stringify(data.Item),
        };
    } catch (err) {
        console.error("Failure", err.message);
        return {
            statusCode: 500,
            body: "Failed to retrieve the order",
        };
    }
};
