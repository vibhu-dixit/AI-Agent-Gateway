import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { GatewayGuard } from './auth/guards/gateway/gateway.guard';

@Controller('v1/agent')
export class AppController {
  
  @Post('chat')
  @UseGuards(GatewayGuard)
  executeAgent(@Body() body: { prompt: string }, @Req() req: any) {
    return {
      status: 'success',
      message: 'Prompt successfully cleared the gateway guardrails.',
      meta: {
        organizationId: req.organization.id,
        remainingBudget: req.organization.budget_limit - req.organization.budget_consumed
      }
    };
  }
}