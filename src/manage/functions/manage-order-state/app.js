import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
    DynamoDBDocumentClient,
    UpdateCommand,
    PutCommand,
} from "@aws-sdk/lib-dynamodb";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const snsClient = new SNSClient({});

const tableName = process.env.ORDER_TABLE;
const snsTopicArn = process.env.SNS_TOPIC_ARN;

export const manageState = async (event) => {
    let orderStatus = "SUCCESS";
    let errorPath = "";

    if (
        "sendOrderToRestaurant" in event &&
        event["sendOrderToRestaurant"]["status"] === "error"
    ) {
        orderStatus = "FAILURE";
        errorPath = "sendOrderToRestaurant";
    } else if (
        "paymentResult" in event &&
        event["paymentResult"]["status"] === "error"
    ) {
        orderStatus = "FAILURE";
        errorPath = "paymentResult";
    }

    if (orderStatus === "FAILURE" || errorPath !== "") {
        const params = createUpdateParams(event, orderStatus, errorPath);
        const result = await updatePut(params, orderStatus);
        return result;
    }

    return await dynamoPut(event);
};

const createUpdateParams = (event, orderStatus, errorPath) => {
    const errorMessage = errorPath ? event[errorPath]["errorMessage"] : "";

    const params = {
        TableName: tableName,
        Key: {
            user_id: event.user_id,
            id: event.id,
        },
        UpdateExpression: `set orderStatus = :s ${
            errorMessage ? ", errorMessage = :m" : ""
        }`,
        ExpressionAttributeValues: {
            ":s": orderStatus,
            ":m": errorMessage,
        },
        ReturnValues: "UPDATED_NEW",
    };

    return params;
};

const updatePut = async (params, orderStatus) => {
    try {
        await docClient.send(new UpdateCommand(params));
        await publishSNS(orderStatus);
        return {
            statusCode: 200,
            body: JSON.stringify("Successfully updated the item!"),
        };
    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify(`Error updating the item: ${err.message}`),
        };
    }
};

const dynamoPut = async (event) => {
    const item = {
        user_id: event.user_id,
        id: event.id,
        name: event.name,
        restaurantId: event.restaurantId,
        createdAt: event.createdAt,
        quantity: event.quantity,
        orderStatus: event.orderStatus,
        messageId: event.messageId || null,
    };

    const params = {
        TableName: tableName,
        Item: item,
    };

    try {
        await docClient.send(new PutCommand(params));
        return {
            statusCode: 200,
            body: JSON.stringify("Successfully created the item!"),
        };
    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify(`Error creating the item: ${err.message}`),
        };
    }
};

const publishSNS = async (status) => {
    const input = {
        TopicArn: snsTopicArn,
        Message: `Order Status: ${status}`,
    };
    try {
        await snsClient.send(new PublishCommand(input));
    } catch (err) {
        console.error(`Error sending SNS message: ${err.message}`);
    }
};
