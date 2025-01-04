// export const handler = async (event) => {
//   const { requestContext, body } = event;
//   const { connectionId, routeKey } = requestContext;

//   if (routeKey === "sendMessage") {
//     const responseMessage = JSON.stringify({
//       message: `Echo: ${JSON.parse(body).data}`,
//     });

//     // Call the API Gateway to send the message back to the client
//     const apiGatewayManagementApi = new AWS.ApiGatewayManagementApi({
//       endpoint: `${requestContext.domainName}/${requestContext.stage}`,
//     });

//     try {
//       await apiGatewayManagementApi
//         .postToConnection({ ConnectionId: connectionId, Data: responseMessage })
//         .promise();
//       return { statusCode: 200, body: "Message sent." };
//     } catch (error) {
//       console.error("Error sending message:", error);
//       return { statusCode: 500, body: "Failed to send message." };
//     }
//   }

//   return { statusCode: 400, body: "Unknown action" };
// };

// export const handler = async (event) => {
//   console.log("### Default route triggered ###");
//   console.log("Event received:", JSON.stringify(event, null, 2));

//   return {
//     statusCode: 200,
//     body: JSON.stringify({ message: "Default route executed" }),
//   };
// };

import AWS from "aws-sdk";

const ApiGatewayManagementApi = AWS.ApiGatewayManagementApi;

export const handler = async (event) => {
  console.log("Received event:", event);

  const connectionId = event.requestContext.connectionId;
  const endpoint = `${event.requestContext.domainName}/${event.requestContext.stage}`;

  const client = new ApiGatewayManagementApi({ endpoint });

  try {
    const body = JSON.parse(event.body);
    console.log("Parsed body:", body);

    await client
      .postToConnection({
        ConnectionId: connectionId,
        Data: JSON.stringify({
          message: "Message received successfully!",
          receivedData: body,
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
