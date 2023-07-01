import dayjs from "dayjs";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const tableName = process.env.ORDER_TABLE;

if (!tableName) {
    throw new Error("The ORDER_TABLE environment variable is not set");
}

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const getCurrentDate = () => {
    return dayjs().format("YYYY-MM-DDTHH:mm:ss");
};

export const updateOrder = async (event) => {
    if (event.httpMethod !== "PUT") {
        throw new Error(
            `updateItem only accept PUT method, you tried: ${event.httpMethod}`
        );
    }

    const formattedDateNow = getCurrentDate();

    const orderId = event.pathParameters.orderId;
    const { body } = event;
    let parsedBody = JSON.parse(body);

    let item = {
        user_id:
            event.requestContext.authorizer.claims["cognito:username"] ||
            event.requestContext.authorizer.claims.username, // Lambda proxy from AWS ApiGateway will directly pass the cognito username.
        id: orderId,
    };

    let params = {
        TableName: tableName,
        Key: item,
        UpdateExpression:
            "set quantity = :q, #nm = :n, restaurantId = :r, updatedAt = :u",
        ExpressionAttributeValues: {
            ":n": parsedBody.name,
            ":q": parsedBody.quantity,
            ":r": parsedBody.restaurantId,
            ":u": formattedDateNow,
        },
        ExpressionAttributeNames: {
            "#nm": "name",
        },
        ReturnValues: "UPDATED_NEW",
    };

    try {
        const command = new UpdateCommand(params);
        const data = await ddbDocClient.send(command);
        console.log("Success for updating Item");
        console.log(data.Attributes);
    } catch (err) {
        console.log("Failure", err.message);
    }

    parsedBody["updatedAt"] = formattedDateNow;

    const response = {
        statusCode: 200,
        body: JSON.stringify(parsedBody),
    };
    return response;
};
