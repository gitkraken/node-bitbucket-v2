const constants = require('./constants');
const buildRepositories = require('./repositories');
const buildRequest = require('./request');
const buildUser = require('./user');
const buildWorkspaces = require('./workspaces');
const { extractResponseBody } = require('./helpers');

/**
 * Simple JavaScript Bitbucket API v2
 *
 * Based on the PHP GitHub API project http://github.com/ornicar/php-github-api
 */

module.exports = function Bitbucket({ proxy, requesterFn } = {}) {
  /**
   * Define HTTP proxy in format localhost:3128
   */
  let $proxy_host;
  let $proxy_port;
  if (proxy) {
    [$proxy_host, $proxy_port] = proxy.split(':');
  }

  const apiModel = {
    $proxy_host,
    $proxy_port,
    constants
  };

  apiModel.repositories = buildRepositories(apiModel);
  apiModel.request = buildRequest({
    proxy_host: $proxy_host,
    proxy_port: $proxy_port,
    requester_fn: requesterFn
  });
  apiModel.user = buildUser(apiModel);
  apiModel.workspaces = buildWorkspaces(apiModel);

  /**
   * Authenticate a user for all next requests using an API token
   *
   * @param {String} accessToken
   * @return {BitbucketApi}        fluent interface
   */
  apiModel.authenticateOAuth2 = (accessToken) => {
    apiModel.request
      .setOption('login_type', 'oauth2')
      .setOption('oauth_access_token', accessToken);

    return apiModel;
  };

  /**
   * Deauthenticate a user for all next requests
   *
   * @return {BitbucketApi}               fluent interface
   */
  apiModel.deAuthenticate = () => {
    apiModel.request
      .setOption('login_type', 'none');

    return apiModel;
  };

  /**
   * Call any route, GET method
   * Ex: api.get('repos/show/my-username/my-repo')
   *
   * @param {String}  route            the Bitbucket route
   * @param {Object}  parameters       GET parameters
   * @param {Object}  requestOptions   reconfigure the request
   */
  apiModel.get = (route, parameters, requestOptions) => apiModel.request.get(route, parameters || {}, requestOptions);

  /**
   * Call any route, DELETE method
   * Ex: api.delete('repos/show/my-username/my-repo')
   *
   * @param {String}  route            the Bitbucket route
   * @param {Object}  parameters       GET parameters
   * @param {Object}  requestOptions   reconfigure the request
   */
  apiModel.delete = (route, parameters, requestOptions) => apiModel.request.delete(route, parameters, requestOptions);

  /**
   * Call any route, POST method
   * Ex: api.post('repos/show/my-username', {'email': 'my-new-email@provider.org'})
   *
   * @param {String}  route            the Bitbucket route
   * @param {Object}  parameters       POST parameters
   * @param {Object}  requestOptions   reconfigure the request
   */
  apiModel.post = (route, parameters, requestOptions) => apiModel.request.post(route, parameters || {}, requestOptions);

  /**
   * Check for whether we can iterate to another page using this.getNextPage(response).
   * @param {response} response A response that was received from the API, or its `body` property.
   * @return {boolean} true if the response indicates more pages are available, false otherwise.
   */
  apiModel.hasNextPage = (response) => Boolean(extractResponseBody(response).next);

  /**
   * Check for whether we can iterate to another page using this.getPreviousPage(response).
   * @param {response} response A response that was received from the API, or its `body` property.
   * @return {boolean} true if the response indicates a previous pages is available, false otherwise.
   */
  apiModel.hasPreviousPage = (response) => Boolean(extractResponseBody(response).previous);

  /**
   * Takes a response and makes an API request for the response's next page.
   * NOTE this should only be called guarded behind a check to `this.hasNextPage(response)`!
   *
   * @param {response} response A response that was received from the API, or its `body` property.
   */
  apiModel.getNextPage = (response) => {
    if (!apiModel.hasNextPage(response)) {
      throw new Error(
        'getNextPage: argument has no next page url. Call hasNextPage first to guard this method call.'
      );
    }

    return apiModel.request.doPrebuiltSend(extractResponseBody(response).next);
  };

  /**
   * Takes a response and makes an API request for the response's previous page.
   * NOTE this should only be called guarded behind a check to `this.hasPreviousPage(response)`!
   *
   * @param {response} response A response that was received from the API, or its `body` property.
   */
  apiModel.getPreviousPage = (response) => {
    if (!apiModel.hasPreviousPage(response)) {
      throw new Error(
        'getPreviousPage: argument has no next page url. Call hasPreviousPage first to guard this method call.'
      );
    }

    return apiModel.request.doPrebuiltSend(extractResponseBody(response).previous);
  };

  return apiModel;
};
