import { constants } from './constants';
import buildRepositoriesApi from './repositories';
import buildRequest, { Request } from './request';
import buildUserApi from './user';
import buildWorkspacesApi from './workspaces';
import { extractResponseBody } from './helpers';
import { BitbucketConstructorOptions, ApiResponse, PaginatedResponse } from './types';

/**
 * Simple JavaScript Bitbucket API v2
 *
 * Based on the PHP GitHub API project http://github.com/ornicar/php-github-api
 */

export interface ApiModel {
  $proxy_host?: string;
  $proxy_port?: string;
  constants: typeof constants;
  repositories: ReturnType<typeof buildRepositoriesApi>;
  request: Request;
  user: ReturnType<typeof buildUserApi>;
  workspaces: ReturnType<typeof buildWorkspacesApi>;

  /**
   * Authenticate a user for all next requests using an API token
   *
   * @param {String} accessToken
   * @return {ApiModel}        fluent interface
   */
  authenticateOAuth2(accessToken: string): ApiModel;

  /**
   * Deauthenticate a user for all next requests
   *
   * @return {ApiModel}               fluent interface
   */
  deAuthenticate(): ApiModel;

  /**
   * Call any route, GET method
   * Ex: api.get('repos/show/my-username/my-repo')
   *
   * @param {String}  route            the Bitbucket route
   * @param {Object}  parameters       GET parameters
   * @param {Object}  requestOptions   reconfigure the request
   */
  get(route: string, parameters?: Record<string, any>, requestOptions?: any): Promise<ApiResponse>;

  /**
   * Call any route, DELETE method
   * Ex: api.delete('repos/show/my-username/my-repo')
   *
   * @param {String}  route            the Bitbucket route
   * @param {Object}  parameters       GET parameters
   * @param {Object}  requestOptions   reconfigure the request
   */
  delete(route: string, parameters?: Record<string, any>, requestOptions?: any): Promise<ApiResponse>;

  /**
   * Call any route, POST method
   * Ex: api.post('repos/show/my-username', {'email': 'my-new-email@provider.org'})
   *
   * @param {String}  route            the Bitbucket route
   * @param {Object}  parameters       POST parameters
   * @param {Object}  requestOptions   reconfigure the request
   */
  post(route: string, parameters?: Record<string, any>, requestOptions?: any): Promise<ApiResponse>;

  /**
   * Check for whether we can iterate to another page using this.getNextPage(response).
   * @param {response} response A response that was received from the API, or its `body` property.
   * @return {boolean} true if the response indicates more pages are available, false otherwise.
   */
  hasNextPage(response: ApiResponse | PaginatedResponse | any): boolean;

  /**
   * Check for whether we can iterate to another page using this.getPreviousPage(response).
   * @param {response} response A response that was received from the API, or its `body` property.
   * @return {boolean} true if the response indicates a previous pages is available, false otherwise.
   */
  hasPreviousPage(response: ApiResponse | PaginatedResponse | any): boolean;

  /**
   * Takes a response and makes an API request for the response's next page.
   * NOTE this should only be called guarded behind a check to `this.hasNextPage(response)`!
   *
   * @param {response} response A response that was received from the API, or its `body` property.
   */
  getNextPage(response: ApiResponse | PaginatedResponse | any): Promise<ApiResponse>;

  /**
   * Takes a response and makes an API request for the response's previous page.
   * NOTE this should only be called guarded behind a check to `this.hasPreviousPage(response)`!
   *
   * @param {response} response A response that was received from the API, or its `body` property.
   */
  getPreviousPage(response: ApiResponse | PaginatedResponse | any): Promise<ApiResponse>;
}

export default function Bitbucket(options: BitbucketConstructorOptions = {}): ApiModel {
  const { proxy, requesterFn } = options;

  /**
   * Define HTTP proxy in format localhost:3128
   */
  let $proxy_host: string | undefined;
  let $proxy_port: string | undefined;
  if (proxy) {
    [$proxy_host, $proxy_port] = proxy.split(':');
  }

  const apiModel: ApiModel = {
    $proxy_host,
    $proxy_port,
    constants,
    repositories: undefined as any,
    request: undefined as any,
    user: undefined as any,
    workspaces: undefined as any,

    /**
     * Authenticate a user for all next requests using an API token
     *
     * @param {String} accessToken
     * @return {ApiModel}        fluent interface
     */
    authenticateOAuth2: (accessToken: string): ApiModel => {
      apiModel.request.setOption('login_type', 'oauth2').setOption('oauth_access_token', accessToken);

      return apiModel;
    },

    /**
     * Deauthenticate a user for all next requests
     *
     * @return {ApiModel}               fluent interface
     */
    deAuthenticate: (): ApiModel => {
      apiModel.request.setOption('login_type', 'none');

      return apiModel;
    },

    /**
     * Call any route, GET method
     * Ex: api.get('repos/show/my-username/my-repo')
     *
     * @param {String}  route            the Bitbucket route
     * @param {Object}  parameters       GET parameters
     * @param {Object}  requestOptions   reconfigure the request
     */
    get: (route: string, parameters?: Record<string, any>, requestOptions?: any): Promise<ApiResponse> =>
      apiModel.request.get(route, parameters || {}, requestOptions),

    /**
     * Call any route, DELETE method
     * Ex: api.delete('repos/show/my-username/my-repo')
     *
     * @param {String}  route            the Bitbucket route
     * @param {Object}  parameters       GET parameters
     * @param {Object}  requestOptions   reconfigure the request
     */
    delete: (route: string, parameters?: Record<string, any>, requestOptions?: any): Promise<ApiResponse> =>
      apiModel.request.delete(route, parameters, requestOptions),

    /**
     * Call any route, POST method
     * Ex: api.post('repos/show/my-username', {'email': 'my-new-email@provider.org'})
     *
     * @param {String}  route            the Bitbucket route
     * @param {Object}  parameters       POST parameters
     * @param {Object}  requestOptions   reconfigure the request
     */
    post: (route: string, parameters?: Record<string, any>, requestOptions?: any): Promise<ApiResponse> =>
      apiModel.request.post(route, parameters || {}, requestOptions),

    /**
     * Check for whether we can iterate to another page using this.getNextPage(response).
     * @param {response} response A response that was received from the API, or its `body` property.
     * @return {boolean} true if the response indicates more pages are available, false otherwise.
     */
    hasNextPage: (response: ApiResponse<PaginatedResponse>): boolean => {
      const body: PaginatedResponse = extractResponseBody(response);
      return Boolean(body.next);
    },

    /**
     * Check for whether we can iterate to another page using this.getPreviousPage(response).
     * @param {response} response A response that was received from the API, or its `body` property.
     * @return {boolean} true if the response indicates a previous pages is available, false otherwise.
     */
    hasPreviousPage: (response: ApiResponse<PaginatedResponse>): boolean => {
      const body = extractResponseBody(response);
      return Boolean(body.previous);
    },

    /**
     * Takes a response and makes an API request for the response's next page.
     * NOTE this should only be called guarded behind a check to `this.hasNextPage(response)`!
     *
     * @param {response} response A response that was received from the API, or its `body` property.
     */
    getNextPage: (response: ApiResponse | PaginatedResponse | any): Promise<ApiResponse> => {
      if (!apiModel.hasNextPage(response)) {
        throw new Error(
          'getNextPage: argument has no next page url. Call hasNextPage first to guard this method call.'
        );
      }

      const body = extractResponseBody(response);
      return apiModel.request.doPrebuiltSend(body.next!);
    },

    /**
     * Takes a response and makes an API request for the response's previous page.
     * NOTE this should only be called guarded behind a check to `this.hasPreviousPage(response)`!
     *
     * @param {response} response A response that was received from the API, or its `body` property.
     */
    getPreviousPage: (response: ApiResponse | PaginatedResponse | any): Promise<ApiResponse> => {
      if (!apiModel.hasPreviousPage(response)) {
        throw new Error(
          'getPreviousPage: argument has no next page url. Call hasPreviousPage first to guard this method call.'
        );
      }

      const body = extractResponseBody(response);
      return apiModel.request.doPrebuiltSend(body.previous!);
    }
  };

  // Initialize modules
  apiModel.repositories = buildRepositoriesApi(apiModel);
  apiModel.request = buildRequest({
    proxy_host: $proxy_host,
    proxy_port: $proxy_port ? parseInt($proxy_port, 10) : null,
    requester_fn: requesterFn || null
  });
  apiModel.user = buildUserApi(apiModel);
  apiModel.workspaces = buildWorkspacesApi(apiModel);

  return apiModel;
}

// Export types
export * from './types';
export { constants } from './constants';
export type { PullRequestState } from './constants';
export type { Request } from './request';
