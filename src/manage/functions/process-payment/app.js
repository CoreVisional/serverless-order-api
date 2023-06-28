export const processPayment = async () => {
    const paymentResult = {};
    const paymentState = ["ok", "error"];
    const errorMessages = [
        "Unable To Contact Payment Processor",
        "Payment Method Declined",
        "Unexpected Payment Processing Error",
    ];

    const paymentRandom = Math.floor(Math.random() * paymentState.length);

    if (paymentState[paymentRandom] === paymentState[1]) {
        const errorRandom = Math.floor(Math.random() * errorMessages.length);
        paymentResult.errorMessage = errorMessages[errorRandom];
    }

    paymentResult.status = paymentState[paymentRandom];

    return paymentResult;
};
