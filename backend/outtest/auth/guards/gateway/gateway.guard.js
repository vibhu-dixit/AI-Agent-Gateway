"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GatewayGuard = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const crypto = require("crypto");
let GatewayGuard = class GatewayGuard {
    constructor(prisma) {
        this.prisma = prisma;
        this.LEAK_POLICIES = [
            /\b(?:\d[ -]*?){13,16}\b/
        ];
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers['x-api-key'];
        if (!authHeader) {
            throw new common_1.UnauthorizedException('Missing X-API-Key header');
        }
        const keyHash = crypto.createHash('sha256').update(authHeader).digest('hex');
        const apiKeyRecord = await this.prisma.api_keys.findUnique({
            where: { key_hash: keyHash },
            include: { organizations: true }
        });
        if (!apiKeyRecord || !apiKeyRecord.is_active) {
            throw new common_1.UnauthorizedException('Invalid or inactive API key');
        }
        const organization = apiKeyRecord.organizations;
        const budgetConsumed = organization.budget_consumed ?? 0;
        const budgetLimit = organization.budget_limit ?? 0;
        if (budgetConsumed >= budgetLimit) {
            throw new common_1.ForbiddenException('403 Budget Exceeded');
        }
        if (request.body) {
            const bodyStr = JSON.stringify(request.body);
            for (const policy of this.LEAK_POLICIES) {
                if (policy.test(bodyStr)) {
                    throw new common_1.ForbiddenException('Guardrail Violation: Sensitive information leak detected.');
                }
            }
        }
        request['organization'] = organization;
        request['apiKeyId'] = apiKeyRecord.id;
        return true;
    }
};
exports.GatewayGuard = GatewayGuard;
exports.GatewayGuard = GatewayGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GatewayGuard);
//# sourceMappingURL=gateway.guard.js.map