import AWS from "aws-sdk";
import fs from "fs";

const s3 = new AWS.S3();
const transcribe = new AWS.TranscribeService();

export const handler = async (event) => {
  try {
    console.log(event);
    // Decode Base64 data received from the event
    const base64Data = event.body; // Replace with the correct path to Base64 data
    const rawAudioData = Buffer.from(base64Data, "base64");

    // Save file to the Lambda /tmp/ directory
    const tempFilePath = `/tmp/audio-${Date.now()}.webm`;
    fs.writeFileSync(tempFilePath, rawAudioData);
    console.log("Audio file saved at:", tempFilePath);

    // Upload file to S3
    const bucketName = "blueberry-transcribe-audio-unique-bucket-2025"; // Replace with your S3 bucket name
    const objectKey = `audio-files/audio-${Date.now()}.webm`;

    const uploadParams = {
      Bucket: bucketName,
      Key: objectKey,
      Body: fs.createReadStream(tempFilePath),
      ContentType: "audio/webm",
    };

    const result = await s3.upload(uploadParams).promise();
    console.log("File uploaded to S3:", result.Location);

    // Start transcription job
    const transcriptionJobName = `transcription-job-${Date.now()}`;
    const transcribeParams = {
      TranscriptionJobName: transcriptionJobName,
      LanguageCode: "en-US",
      Media: {
        MediaFileUri: `s3://${bucketName}/${objectKey}`,
      },
      OutputBucketName: bucketName, // Optional: Store transcription output in the same bucket
    };

    await transcribe.startTranscriptionJob(transcribeParams).promise();
    console.log("Transcription job started:", transcriptionJobName);

    // Poll for transcription job status
    let transcriptionStatus = "IN_PROGRESS";
    let transcriptionResult = null;

    while (transcriptionStatus === "IN_PROGRESS") {
      const { TranscriptionJob } = await transcribe
        .getTranscriptionJob({ TranscriptionJobName: transcriptionJobName })
        .promise();

      transcriptionStatus = TranscriptionJob.TranscriptionJobStatus;
      console.log("Transcription job status:", transcriptionStatus);

      if (transcriptionStatus === "FAILED") {
        throw new Error("Transcription job failed");
      }

      if (transcriptionStatus === "COMPLETED") {
        const transcriptFileUri = TranscriptionJob.Transcript.TranscriptFileUri;
        console.log(
          "Transcription completed. Transcript URI:",
          transcriptFileUri
        );

        // Fetch transcription result from the transcript file URI
        const response = await fetch(transcriptFileUri);
        const transcriptJson = await response.text();
        console.log(transcriptJson);
        transcriptionResult = transcriptJson.results.transcripts[0].transcript;
      }

      // Wait for 5 seconds before polling again
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Audio processed, uploaded, and transcribed successfully",
        transcription: transcriptionResult,
        s3Url: result.Location,
      }),
    };
  } catch (error) {
    console.error("Error processing audio:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Failed to process audio",
        error: error.message,
      }),
    };
  }
};
