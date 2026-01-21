import { diskStorage } from 'multer';
import { extname } from 'path';

export const uploadConfig = {
  storage: diskStorage({
    destination: './uploads',
    filename: (_, file, cb) => {
      const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, unique + extname(file.originalname));
    },
  }),
};
