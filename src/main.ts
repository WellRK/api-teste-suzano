import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import BooleanUtil from './shared/utils/boolean.util';
import { EnviromentVariablesEnum } from './shared/enums/enviroment.variables.enum';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as bodyParser from 'body-parser';
import { json } from 'body-parser';
import { StructuredLogger } from './shared/logger/structured-logger.service';
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';

async function bootstrap() {
  const enviroment = process.env.NODE_ENV.toUpperCase();

  const keyFileExists = fs.existsSync('./../secrets/imoveistock.api.key.pem');
  const certFileExists = fs.existsSync('./../secrets/imoveistock.api.crt.pem');
  const httpsOptions =
    keyFileExists && certFileExists
      ? {
          key: fs.readFileSync('./../secrets/imoveistock.api.key.pem'),
          cert: fs.readFileSync('./../secrets/imoveistock.api.crt.pem'),
        }
      : null;

  const app = await NestFactory.create(AppModule, {
    httpsOptions,
    bufferLogs: true,
  });

  app.useLogger(new StructuredLogger());
  app.useGlobalFilters(new HttpExceptionFilter());

  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(
    bodyParser.urlencoded({
      limit: '50mb',
      extended: true,
      parameterLimit: 50000,
    }),
  );

  const configService = app.get(ConfigService);
  const _logger = new Logger('main');

  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

  if (
    BooleanUtil.getBoolean(
      configService.get(EnviromentVariablesEnum.ENABLE_CORS),
    )
  ) {
    const corsOptions = {
      origin: '*',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      preflightContinue: false,
      optionsSuccessStatus: 204,
      credentials: true,
      allowedHeaders: 'Content-Type, Accept, Authorization',
    };
    app.enableCors(corsOptions);

    _logger.debug('ENABLE CORS *');
  }

  if (
    BooleanUtil.getBoolean(
      configService.get(EnviromentVariablesEnum.ENABLE_DOCS),
    )
  ) {
    const swaggerOptions = new DocumentBuilder()
      .setTitle(`OVGS API | ${enviroment}`)
      .setVersion('0.0.1')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
      .build();

    const document = SwaggerModule.createDocument(app, swaggerOptions);
    SwaggerModule.setup('docs', app, document);

    _logger.debug('ENABLE DOCS');
  }

  const port = configService.get(EnviromentVariablesEnum.PORT) || 6789;
  await app.listen(port);
  _logger.log(`${enviroment} | OVGS API started at port ${port}`);
}
bootstrap();
