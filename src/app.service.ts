import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getStatus() {
    return {
      name: 'e-commerce-api',
      status: 'ok',
      docsPath: '/api/docs',
    };
  }
}
