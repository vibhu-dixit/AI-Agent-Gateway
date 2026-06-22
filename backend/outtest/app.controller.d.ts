export declare class AppController {
    executeAgent(body: {
        prompt: string;
    }, req: any): {
        status: string;
        message: string;
        meta: {
            organizationId: any;
            remainingBudget: number;
        };
    };
}
