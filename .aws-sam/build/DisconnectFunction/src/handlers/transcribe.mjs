import AWS from "aws-sdk";
import fs from "fs";

const s3 = new AWS.S3();
const transcribe = new AWS.TranscribeService();

export async function transcribeAudio(filePath) {
  const bucketname = "blueberry-transcribe-audio-unique-bucket-2025";
  const objectKey = `audio-files/audio-${Date.now()}.webm`;

  // Upload the audio file to S3
  const uploadParams = {
    Bucket: bucketname,
    Key: objectKey,
    Body: fs.createReadStream(filePath),
    ContentType: "audio/webm",
  };

  await s3.upload(uploadParams).promise();
  console.log("Uploaded audio file to S3: ", objectKey);

  // Start transcription job
  const transcriptionJobName = `transcription-job-${Date.now()}`;
  const transcribeParams = {
    TranscriptionJobName: transcriptionJobName,
    LanguageCode: "en-US",
    Media: { MediaFileUri: `s3://${bucketname}/${objectKey}` },
    OutputBucketName: bucketname,
  };

  await transcribe.startTranscriptionJob(transcribeParams).promise();
  console.log("Started transcription job: ", transcriptionJobName);

  let status = "IN_PROGRESS";
  while (status === "IN_PROGRESS") {
    const { TranscriptionJob } = await transcribe
      .getTranscriptionJob({ TranscriptionJobName: transcriptionJobName })
      .promise();

    status = TranscriptionJob.TranscriptionJobStatus;
    console.log("Transcription job status: ", status);

    if (status === "FAILED") {
      throw new Error("Transcription job failed");
    }

    if (status === "COMPLETED") {
      const transcriptUrl = TranscriptionJob.Transcript.TranscriptFileUri;
      console.log("Transcription completed. Transcript URL: ", transcriptUrl);

      const transcriptResponse = await fetch(transcriptUrl);
      const transcriptData = await transcriptResponse.json();

      return transcriptData.results.transcripts[0].transcript;
    }

    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}
