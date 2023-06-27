import dayjs from "dayjs";
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

    // Reading records from SQS in a loop
    for (const record of event.Records) {
        const { messageId, body } = record;
        let parsedBody = JSON.parse(body);

        // Pass MessageId to Id parameter in Item payload instead of using uuid in Id
        let item = {
            user_id: "static_user",
            id: messageId,
            name: parsedBody.data.name,
            restaurantId: parsedBody.data.restaurantId,
            quantity: parsedBody.data.quantity,
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
    }

    const response = {
        statusCode: 200,
    };
    return response;
};
