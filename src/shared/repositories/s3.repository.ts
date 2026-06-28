import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3 } from 'aws-sdk';
import { EnviromentVariablesEnum } from '../enums/enviroment.variables.enum';
import { v4 as uuid } from 'uuid';

@Injectable()
export class S3Repository {
  s3: S3;

  // constructor(private readonly configService: ConfigService) {
  //   this.s3 = new S3({
  //     region: this.configService.get(EnviromentVariablesEnum.AWS_REGION),
  //     accessKeyId: configService.get(EnviromentVariablesEnum.AWS_ACCESS_KEY_ID),
  //     secretAccessKey: configService.get(
  //       EnviromentVariablesEnum.AWS_SECRET_ACCESS_KEY,
  //     ),
  //   });
  // }

  constructor(private readonly configService: ConfigService) {
    this.s3 = new S3({
      region: this.configService.get(EnviromentVariablesEnum.AWS_REGION),
      accessKeyId: this.configService.get(
        EnviromentVariablesEnum.AWS_ACCESS_KEY_ID,
      ),
      secretAccessKey: this.configService.get(
        EnviromentVariablesEnum.AWS_SECRET_ACCESS_KEY,
      ),
      endpoint: this.configService.get('AWS_S3_ENDPOINT'), // Aqui tá o pulo do gato
      s3ForcePathStyle: true, // Necessário pra muitos storages compatíveis com S3
    });
  }

  async getPreSignedUrl(
    bucket: string,
    key: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    const params = {
      Bucket: bucket,
      Key: key,
      Expires: expiresIn, // Tempo em segundos
    };

    return this.s3.getSignedUrlPromise('getObject', params);
  }

  async uploadBase64(bucket: string, key: string, base64File: string) {
    const pos = base64File.indexOf(';base64,');
    const type = base64File.substring(5, pos);
    var b64 = base64File.substr(pos + 8);

    const buffer = Buffer.from(b64, 'base64');

    return await this.s3
      .upload({
        Bucket: bucket,
        Key: String(key),
        Body: buffer,
        ContentEncoding: 'base64',
        ContentType: type,
        // ACL: 'public-read'
      })
      .promise();
  }

  async uploadFile(bucket: string, file: Express.Multer.File) {
    const s3 = new S3();

    const buffer = file.buffer;

    return await s3
      .upload({
        Bucket: bucket,
        Body: buffer,
        Key: uuid(),
      })
      .promise();
  }

  async uploadFileImage(bucket: string, file: Express.Multer.File) {
    const fileExtension = file.originalname.split('.').pop();
    const fileKey = `images/${uuid()}.${fileExtension}`;

    return await this.s3
      .upload({
        Bucket: bucket,
        Body: file.buffer,
        Key: fileKey,
        ContentType: file.mimetype,
        ACL: 'public-read',
      })
      .promise();
  }
  async download(bucket: string, key: string) {
    const response = await this.s3
      .getObject({
        Bucket: bucket,
        Key: String(key),
      })
      .promise();

    const base64String = response.Body.toString('base64');

    return { base64String };
  }

  async delete(bucket: string, key: string) {
    await this.s3.deleteObject({
      Bucket: bucket,
      Key: key,
    });
  }

  async uploadFileAudio(bucket: string, file: Express.Multer.File) {
    const fileExtension = file.originalname.split('.').pop();
    const fileKey = `audio/${uuid()}.${fileExtension}`;

    return await this.s3
      .upload({
        Bucket: bucket,
        Body: file.buffer,
        Key: fileKey,
        ContentType: file.mimetype,
        ACL: 'public-read',
      })
      .promise();
  }

  async uploadVideo(bucket: string, file: Express.Multer.File) {
    try {
      const fileExtension = file.originalname.split('.').pop();
      const fileKey = `video/${uuid()}.${fileExtension}`;
      return await this.s3
        .upload({
          Bucket: bucket,
          Body: file.buffer,
          Key: fileKey,
          ContentType: file.mimetype,
          ACL: 'public-read',
        })
        .promise();
    } catch (error) {
      throw new Error(`Falha no upload de vídeo: ${error.message}`);
    }
  }
}
