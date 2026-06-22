import { 
  CanActivate, 
  ExecutionContext, 
  Injectable, 
  UnauthorizedException, 
  ForbiddenException 
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class GatewayGuard implements CanActivate {
  // Simple regex rule matching standard credit card patterns (Phase 1 leak protection)
  private readonly LEAK_POLICIES = [
    /\b(?:\d[ -]*?){13,16}\b/ // Credit Card Regex
  ];

  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // 1. API Key Authentication
    const authHeader = request.headers['x-api-key'];
    if (!authHeader) {
      throw new UnauthorizedException('Missing X-API-Key header');
    }

    // Hash the incoming key to compare with the database storage
    const keyHash = crypto.createHash('sha256').update(authHeader).digest('hex');
    
    
    const apiKeyRecord = await this.prisma.api_keys.findUnique({
      where: { key_hash: keyHash },
      include: { organizations: true }
    });

    if (!apiKeyRecord || !apiKeyRecord.is_active) {
      throw new UnauthorizedException('Invalid or inactive API key');
    }

    const organization = apiKeyRecord.organizations;

    // 2. Budget Protection Middleware
    const budgetConsumed = organization.budget_consumed ?? 0;
    const budgetLimit = organization.budget_limit ?? 0;

    if (budgetConsumed >= budgetLimit) {
      throw new ForbiddenException('403 Budget Exceeded');
    }

    // 3. Data Leak Detection Guardrail
    if (request.body) {
      const bodyStr = JSON.stringify(request.body);
      for (const policy of this.LEAK_POLICIES) {
        if (policy.test(bodyStr)) {
          throw new ForbiddenException('Guardrail Violation: Sensitive information leak detected.');
        }
      }
    }

    // Attach organization metadata to the request for down-stream logging
    request['organization'] = organization;
    request['apiKeyId'] = apiKeyRecord.id;

    return true;
  }
}