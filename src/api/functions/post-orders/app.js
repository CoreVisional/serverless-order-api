import dayjs from "dayjs";
import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";

const sfnClient = new SFNClient({});
const stateMachineArn = process.env.STATE_MACHINE_ARN;

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

        // Create an item object to be passed to step functions
        let item = {
            user_id: parsedBody.cognito_userid,
            id: messageId,
            name: parsedBody.data.name,
            restaurantId: parsedBody.data.restaurantId,
            quantity: parsedBody.data.quantity,
            createdAt: formattedDateNow.toString(),
            orderStatus: DEFAULT_ORDER_STATUS,
        };

        // Create step functions object from input and stateMachine arn.
        const startReq = {
            stateMachineArn: stateMachineArn,
            input: JSON.stringify(item),
            name: messageId,
        };

        // Call the startExecution method of step functions client with input
        try {
            console.log("Starting an SFN execution: ", {
                stateMachineArn: stateMachineArn,
            });
            const command = new StartExecutionCommand(startReq);
            await sfnClient.send(command);
            console.log("Job Completed");
        } catch (error) {
            console.log(error);
        }
    }

    const response = {
        statusCode: 200,
    };

    return response;
};
