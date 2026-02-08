import { Controller, Get } from '@nestjs/common';

@Controller('ops')
export class OpsController {
  @Get('health')
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
