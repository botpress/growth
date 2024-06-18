import type * as bp from ".botpress";

export type Implementation = ConstructorParameters<typeof bp.Integration>[0];

export type Client = bp.Client;
export type Context = bp.Context;
export type Logger = bp.Logger;
export type Handler = bp.IntegrationProps["handler"];
export type HandlerProps = Parameters<Handler>[0];
