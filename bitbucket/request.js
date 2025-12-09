const https = require('https');
const querystring = require('querystring');
const url = require('url');

/**
 * Performs requests on Bitbucket API.
 */
module.exports = function Request(_options) {
  const $defaults = {
    protocol: 'https',
    path: '/2.0',
    hostname: 'api.bitbucket.org',
    format: 'json',
    user_agent: 'node-bitbucket-v2 (https://www.npmjs.com/package/bitbucket-v2)',
    http_port: 443,
    timeout: 20,
    login_type: 'none',
    username: null,
    password: null,
    api_token: null,
    oauth_access_token: null,
    proxy_host: null,
    proxy_port: null,
    requester_fn: null
  };
  const $options = { ...$defaults, ..._options };

  const result = {
    $defaults,
    $options,

    /**
     * Change an option value.
     *
     * @param {String} name   The option name
     * @param {Object} value  The value
     *
     * @return {Request} The current object instance
     */
    setOption(name, value) {
      $options[name] = value;
      return result;
    },

    /**
      * Get an option value.
      *
      * @param  string $name The option name
      *
      * @return mixed  The option value
      */
    getOption(name, _defaultValue) {
      const defaultValue = _defaultValue === undefined ? null : _defaultValue;
      return $options[name] ? $options[name] : defaultValue;
    },

    /**
     * Send a GET request
     * @see doSend
     */
    get(apiPath, parameters, options) {
      return result.doSend(apiPath, parameters, 'GET', options);
    },

    /**
     * Send a POST request
     * @see doSend
     */
    post(apiPath, parameters, options) {
      return result.doSend(apiPath, parameters, 'POST', options);
    },

    /**
     * Send a DELETE request
     * @see doSend
     */
    delete(apiPath, parameters, options) {
      return result.doSend(apiPath, parameters, 'GET', options);
    },

    /**
     * Send a request to the server using a URL received from the API directly, receive a response
     *
     * @param {String}   $prebuiltURL       Request URL given by a previous API call
     */
    doPrebuiltSend(prebuiltURL) {
      const { headers, port } = result.prepRequest($options);

      if ($options.requester_fn) {
        const requesterOptions = {
          headers,
          method: 'GET',
          url: prebuiltURL
        };

        return $options.requester_fn(requesterOptions);
      }

      const { hostname, path } = url.parse(prebuiltURL);
      const httpsOptions = {
        headers,
        hostname,
        method: 'GET',
        path,
        port
      };

      return result.sendHttpsRequest(httpsOptions);
    },

    /**
     * Send a request to the server, receive a response
     *
     * @param {String}   apiPath       Request API path
     * @param {Object}    parameters    Parameters
     * @param {String}   _httpMethod    HTTP method to use
     * @param  {Object}    options        reconfigure the request for this call only
     */
    doSend(apiPath, parameters, _httpMethod = 'GET', options = $options) {
      const method = _httpMethod.toUpperCase();
      const { headers, hostname, port } = result.prepRequest(options);

      let query;
      const path = options.path + '/' + apiPath.replace(/\/*$/, ''); // eslint-disable-line prefer-template
      if (method === 'POST') {
        query = JSON.stringify(parameters);
        headers['Content-Type'] = 'application/json';
        headers['Content-Length'] = query.length;
      }
      else {
        query = querystring.stringify(parameters);
      }

      if (options.requester_fn) {
        const requesterOptions = {
          headers,
          hostname,
          method,
          path,
          query,
          url: `https://${hostname}${path}?${query}`
        };

        if (method === 'POST') {
          requesterOptions.body = parameters;
        }

        return options.requester_fn(requesterOptions);
      }

      const httpsOptions = {
        headers,
        hostname,
        method,
        path: `${path}?${query}`,
        port
      };

      return result.sendHttpsRequest(httpsOptions, query);
    },

    /**
     * Get a JSON response and transform to JSON
     */
    decodeResponse(response) {
      if ($options.format === 'json') {
        if (!response) {
          return {};
        }
        return JSON.parse(response);
      }

      return response;
    },

    prepRequest(options) {
      const {
        hostname: _hostname,
        http_port: httpPort,
        oauth_access_token: oauthAccessToken,
        proxy_host: proxyHost,
        proxy_port: proxyPort,
        requester_fn
      } = options;
      const hostname = !requester_fn && proxyHost ? proxyHost : _hostname;
      const port = !requester_fn && proxyHost ? proxyPort || 3128 : httpPort || 443;

      const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Bearer ${oauthAccessToken}`,
        Host: 'api.bitbucket.org',
        'User-Agent': 'NodeJS HTTP Client',
        'Content-Length': '0'
      };

      return { headers, hostname, port };
    },

    sendHttpsRequest(httpsOptions, query) {
      let resolve;
      let reject;
      const resultPromise = new Promise((_resolve, _reject) => {
        resolve = _resolve;
        reject = _reject;
      });

      const request = https.request(httpsOptions, (response) => {
        response.setEncoding('utf8');

        const rawBody = [];
        response.addListener('data', (chunk) => {
          rawBody.push(chunk);
        });
        response.addListener('end', () => {
          let body = rawBody.join('');

          if (response.statusCode >= 400) {
            if (response.headers['content-type'].includes('application/json')) {
              body = JSON.parse(body);
            }
            reject({ statusCode: response.statusCode, body });
            return;
          }

          body = result.decodeResponse(body);

          resolve({ statusCode: response.statusCode, body });
        });

        response.addListener('error', (e) => {
          reject(e);
        });

        response.addListener('timeout', () => {
          reject(new Error('Request timed out'));
        });
      });

      request.on('error', (e) => {
        reject(e);
      });

      if (httpsOptions.method === 'POST') {
        request.write(query);
      }

      request.end();

      return resultPromise;
    }
  };

  return result;
};
