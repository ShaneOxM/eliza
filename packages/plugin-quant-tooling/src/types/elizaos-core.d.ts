declare module '@elizaos/core' {
    export interface IAgentRuntime {
        getSetting(key: string): string | undefined;
        setSetting(key: string, value: string): void;
        logger: {
            error(message: string, ...args: any[]): void;
            info(message: string, ...args: any[]): void;
            debug(message: string, ...args: any[]): void;
        };
        providers: {
            get(name: string): Provider;
        };
        memory: {
            store(data: { type: string; content: any }): Promise<void>;
        };
    }

    export interface Provider {
        initialize?(): Promise<void>;
        validate(runtime: IAgentRuntime): Promise<boolean>;
        handler(runtime: IAgentRuntime): Promise<any>;
    }

    export interface Memory {
        id: string;
        content: {
            text?: string;
            symbol?: string;
            [key: string]: any;
        };
    }

    export interface State {
        memories: Memory[];
        context: any;
    }

    export interface Action {
        name: string;
        description: string;
        examples?: Array<{
            input: string;
            output: string;
        }>;
        validate?(runtime: IAgentRuntime, message: Memory): Promise<boolean>;
        handler(
            runtime: IAgentRuntime,
            message: Memory,
            state: State,
            params: any
        ): Promise<boolean>;
    }

    export interface Plugin {
        name: string;
        description: string;
        actions?: Action[];
        providers?: Provider[];
        evaluators?: any[];
        services?: any[];
        initialize?(runtime: IAgentRuntime): Promise<void>;
        cleanup?(): Promise<void>;
    }
}