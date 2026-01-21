import { FileInterceptor } from '@nestjs/platform-express';
import { uploadConfig } from './upload.config';

export const UploadInterceptor = (fieldName = 'file') =>
  FileInterceptor(fieldName, uploadConfig);
