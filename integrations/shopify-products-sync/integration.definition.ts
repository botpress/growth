import { IntegrationDefinition } from "@botpress/sdk";
import {
  configuration,
  states,
  actions,
  events,
} from "./src/definitions/index";

export default new IntegrationDefinition({
  name: 'dc-shopify-products-sync-new',
  title: 'Shopify products sync Duplicate',
  version: '3.0.1',
  readme: 'hub.md',
  icon: 'icon.svg',
  description: 'Sync products from Shopify to Botpress Knowledge Base',
  configuration,
  actions,
  states,
  events,
});
