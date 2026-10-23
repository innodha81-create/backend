import { S3Client, HeadBucketCommand, ListBucketsCommand } from '@aws-sdk/client-s3';

export const s3Client = new S3Client({
  region: process.env.S3_REGION || 'ap-south-1',
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || ''
  },
  forcePathStyle: true
});

export const checkS3Health = async () => {
  const startTime = Date.now();
  const bucketName = process.env.S3_BUCKET_NAME || 'backend';

  try {
    // Try HeadBucket or ListBuckets
    try {
      await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
    } catch (headErr) {
      // If bucket check fails or bucket permissions require list, fallback to ListBuckets
      await s3Client.send(new ListBucketsCommand({}));
    }

    const latencyMs = Date.now() - startTime;
    return {
      status: 'UP',
      type: 'Supabase S3 Storage',
      bucket: bucketName,
      region: process.env.S3_REGION || 'ap-south-1',
      latencyMs
    };
  } catch (error) {
    return {
      status: 'DOWN',
      type: 'Supabase S3 Storage',
      bucket: bucketName,
      latencyMs: Date.now() - startTime,
      error: error.message
    };
  }
};
