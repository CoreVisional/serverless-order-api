import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb";

const tableName = process.env.ORDER_TABLE;

if (!tableName) {
    throw new Error("The ORDER_TABLE environment variable is not set");
}

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

export const deleteOrder = async (event) => {
    const orderId = event.pathParameters.orderId;

    const item = {
        user_id:
            event.requestContext.authorizer.claims["cognito:username"] ||
            event.requestContext.authorizer.claims.username, // Lambda proxy from AWS ApiGateway will directly pass the cognito username.
        id: orderId,
    };

    const params = {
        TableName: tableName,
        Key: item,
    };

    try {
        const deleteCommand = new DeleteCommand(params);
        await ddbDocClient.send(deleteCommand);
    } catch (err) {
        console.log("Failure", err.message);
    }

    return {
        statusCode: 204,
    };
};
