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
    if ("sendOrderToRestaurant" in event) {
        const orderStatus =
            event["sendOrderToRestaurant"]["status"] == "error"
                ? "FAILURE"
                : "SUCCESS";
        const params = createUpdateParams(event, orderStatus);
        const result = await updatePut(params, orderStatus);
        return result;
    }

    if ("paymentResult" in event) {
        if (event["paymentResult"]["status"] == "error") {
            const orderStatus = "FAILURE";
            const params = createUpdateParams(event, orderStatus);
            const result = await updatePut(params, orderStatus);
            return result;
        }
    }

    const response = await dynamoPut(event);
    return response;
};

const createUpdateParams = (event, orderStatus) => {
    let errorMessage = "";
    let updateExpression = `set orderStatus = :s`;
    let expressionAttributeValues = {
        ":s": orderStatus,
    };

    if (
        "sendOrderToRestaurant" in event &&
        event["sendOrderToRestaurant"]["status"] === "error"
    ) {
        errorMessage = event["sendOrderToRestaurant"]["errorMessage"];
        updateExpression += `, errorMessage = :m`;
        expressionAttributeValues[":m"] = errorMessage;
    }

    if (
        "paymentResult" in event &&
        event["paymentResult"]["status"] === "error"
    ) {
        errorMessage = event["paymentResult"]["errorMessage"];
        updateExpression += `, errorMessage = :m`;
        expressionAttributeValues[":m"] = errorMessage;
    }

    let params = {
        TableName: tableName,
        Key: {
            user_id: event.user_id,
            id: event.id,
        },
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: "UPDATED_NEW",
    };

    return params;
};

const updatePut = async (params, orderStatus) => {
    try {
        await docClient.send(new UpdateCommand(params));
        await snsPublish(orderStatus);
        return {
            statusCode: 200,
            body: JSON.stringify("Successfully updated the item!"),
        };
    } catch (err) {
        console.log("Failure", err.message);
    }
};

const dynamoPut = async (event) => {
    let item = {
        user_id: event.user_id,
        id: event.id,
        name: event.name,
        restaurantId: event.restaurantId,
        createdAt: event.createdAt,
        quantity: event.quantity,
        orderStatus: event.orderStatus,
    };

    // Check if the value is undefined as it is not always message id will be there in the event
    if (event.messageId) {
        item.messageId = event.messageId;
    }

    let params = {
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
        console.log("Failure", err.message);
    }
};

const snsPublish = async (status) => {
    let message = `Order Status: ${status}`;
    const input = {
        TopicArn: snsTopicArn,
        Message: message,
    };
    try {
        await snsClient.send(new PublishCommand(input));
    } catch (err) {
        console.log("Failure", err.message);
    }
};
