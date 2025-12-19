/**
 * @praxos/infra-auth0
 *
 * Auth0 infrastructure adapter - implements identity domain ports.
 *
 * Structure:
 * - client.ts      Auth0 OAuth2 client implementation
 * - adapters/      Port implementations using Auth0 SDK
 */

export { Auth0ClientImpl, loadAuth0Config, type Auth0Config } from './client.js';
