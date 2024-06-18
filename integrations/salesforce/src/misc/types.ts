import type * as bp from ".botpress";

export type Action = ConstructorParameters<typeof bp.Integration>[0]["actions"];

export type Client = bp.Client;
export type Context = bp.Context;
export type Logger = bp.Logger;
export type Handler = bp.IntegrationProps["handler"];
export type HandlerProps = Parameters<Handler>[0];

export enum SalesforceObject {
  Contact = "Contact",
  Case = "Case",
  Lead = "Lead",
}
export type QueryOutput =
  | {
      success: true;
      records: any[];
    }
  | { success: false; error: string };
