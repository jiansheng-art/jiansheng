import { PutObjectCommand, S3 } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from './env';

class S3Controller {
  private s3: S3;
  constructor() {
    this.s3 = new S3({
      endpoint: env.S3_SERVER_URL,
      region: 'auto',
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY_ID,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY,
      },
    });
  }

  async getUploadPresignedUrl(key: string) {
    const putObjectCommand = new PutObjectCommand({
      Bucket: env.S3_BUCKET_NAME,
      Key: key,
    });

    return await getSignedUrl(this.s3, putObjectCommand);
  }

  getFileUrl(key: string) {
    return new URL(key, `${env.S3_PUBLIC_BASE_URL.replace(/\/$/, '')}/`).toString();
  }

  async deleteFile(key: string) {
    await this.s3.deleteObject({
      Bucket: env.S3_BUCKET_NAME,
      Key: key,
    });
  }
}

export const s3 = new S3Controller();
