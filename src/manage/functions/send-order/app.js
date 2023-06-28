export const sendOrder = async () => {
    const sendOrderResult = {};
    const sendOrderState = Array(9).fill("ok").concat("error");
    const errorMessages = [
        "Failed to contact restaurant",
        "Failed to process order",
        "Unexpected Order Processing Error",
    ];

    const sendRandomOrder = Math.floor(Math.random() * sendOrderState.length);

    if (sendOrderState[sendRandomOrder] === "error") {
        const errorRandom = Math.floor(Math.random() * errorMessages.length);
        sendOrderResult.errorMessage = errorMessages[errorRandom];
    }

    sendOrderResult.status = sendOrderState[sendRandomOrder];

    return sendOrderResult;
};
