import AWS from "aws-sdk";

const ApiGatewayManagementApi = AWS.ApiGatewayManagementApi;

export const handler = async (event) => {
  console.log("Received event:", event);

  const connectionId = event.requestContext.connectionId;
  const endpoint = `${event.requestContext.domainName}/${event.requestContext.stage}`;

  const client = new ApiGatewayManagementApi({ endpoint });

  try {
    let rawAudioData;

    if (event.isBase64Encoded) {
      console.log("Data is base64 encoded. Decoding...");
      rawAudioData = Buffer.from(event.body, "base64"); // Decode Base64
    } else {
      console.log("Minhdz");
      rawAudioData = Buffer.from(event.body, "utf8"); // Handle text/JSON
    }

    console.log("Received data:", rawAudioData);

    await client
      .postToConnection({
        ConnectionId: connectionId,
        Data: JSON.stringify({
          message: "Message received successfully!",
          receivedData: rawAudioData,
        }),
      })
      .promise();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Message sent successfully!",
      }),
    };
  } catch (error) {
    console.error("Error:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Failed to send message",
        error: error.message,
      }),
    };
  }
};
