export const handler = async (event) => {
  const message = JSON.parse(event.body);
  const connectionId = event.requestContext.connectionId;

  console.log(`Received message from ${connectionId}`, message);

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Message received", received: message }),
  };
};
