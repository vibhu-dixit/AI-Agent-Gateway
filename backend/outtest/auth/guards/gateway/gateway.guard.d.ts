import { CanActivate, ExecutionContext } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
export declare class GatewayGuard implements CanActivate {
    private prisma;
    private readonly LEAK_POLICIES;
    constructor(prisma: PrismaService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
