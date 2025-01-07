import AWS from "aws-sdk";
import fs from "fs";
import path from "path";
import { transcribeAudio } from "./transcribe.mjs";
import { fileTypeFromBuffer } from "file-type";

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

    const detectedType = await fileTypeFromBuffer(rawAudioData);
    console.log("Detected file type:", detectedType);

    const tempFilePath = `/tmp/audio-${Date.now()}.webm`;
    fs.writeFileSync(tempFilePath, rawAudioData);
    console.log("Saved audio data to: ", tempFilePath);

    // Transcribe the audio
    const transcription = await transcribeAudio(tempFilePath);

    await client
      .postToConnection({
        ConnectionId: connectionId,
        Data: JSON.stringify({
          message: "Transcription completed!",
          transcription,
        }),
      })
      .promise();

    console.log("Sent transcription to client");

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Transcription handled successfully!",
      }),
    };
  } catch (error) {
    console.error("Error:", error);

    await client
      .postToConnection({
        ConnectionId: connectionId,
        Data: JSON.stringify({
          message: "Failed to transcribe audio",
          error: error.message,
        }),
      })
      .promise();

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Failed to send message",
        error: error.message,
      }),
    };
  }
};
