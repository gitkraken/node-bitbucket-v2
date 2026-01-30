import * as https from 'https';
import * as querystring from 'querystring';
import * as url from 'url';
import { RequestOptions, ApiResponse } from './types';

interface HttpsRequestOptions {
  headers: Record<string, string>;
  hostname: string;
  method: string;
  path: string;
  port: number;
}

interface PrepRequestResult {
  headers: Record<string, string>;
  hostname: string;
  port: number;
}

export interface Request {
  $defaults: RequestOptions;
  $options: RequestOptions;
  setOption(name: string, value: any): Request;
  getOption(name: string, defaultValue?: any): any;
  get(apiPath: string, parameters?: Record<string, any>, options?: RequestOptions): Promise<ApiResponse>;
  post(apiPath: string, parameters?: Record<string, any>, options?: RequestOptions): Promise<ApiResponse>;
  delete(apiPath: string, parameters?: Record<string, any>, options?: RequestOptions): Promise<ApiResponse>;
  doPrebuiltSend(prebuiltURL: string): Promise<ApiResponse>;
  doSend(
    apiPath: string,
    parameters: Record<string, any>,
    httpMethod?: string,
    options?: RequestOptions
  ): Promise<ApiResponse>;
  decodeResponse(response: string): any;
  prepRequest(options: RequestOptions): PrepRequestResult;
  sendHttpsRequest(httpsOptions: HttpsRequestOptions, query?: string): Promise<ApiResponse>;
}

/**
 * Performs requests on Bitbucket API.
 */
export default function buildRequest(_options?: RequestOptions): Request {
  const $defaults: RequestOptions = {
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
  const $options: RequestOptions = { ...$defaults, ..._options };

  const result: Request = {
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
    setOption(name: string, value: any): Request {
      ($options as any)[name] = value;
      return result;
    },

    /**
     * Get an option value.
     *
     * @param  string $name The option name
     *
     * @return mixed  The option value
     */
    getOption(name: string, _defaultValue?: any): any {
      const defaultValue = _defaultValue === undefined ? null : _defaultValue;
      return ($options as any)[name] ? ($options as any)[name] : defaultValue;
    },

    /**
     * Send a GET request
     * @see doSend
     */
    get(apiPath: string, parameters?: Record<string, any>, options?: RequestOptions): Promise<ApiResponse> {
      return result.doSend(apiPath, parameters || {}, 'GET', options);
    },

    /**
     * Send a POST request
     * @see doSend
     */
    post(apiPath: string, parameters?: Record<string, any>, options?: RequestOptions): Promise<ApiResponse> {
      return result.doSend(apiPath, parameters || {}, 'POST', options);
    },

    /**
     * Send a DELETE request
     * @see doSend
     */
    delete(apiPath: string, parameters?: Record<string, any>, options?: RequestOptions): Promise<ApiResponse> {
      return result.doSend(apiPath, parameters || {}, 'GET', options);
    },

    /**
     * Send a request to the server using a URL received from the API directly, receive a response
     *
     * @param {String}   $prebuiltURL       Request URL given by a previous API call
     */
    doPrebuiltSend(prebuiltURL: string): Promise<ApiResponse> {
      const { headers, port } = result.prepRequest($options);

      if ($options.requester_fn) {
        const requesterOptions = {
          headers,
          method: 'GET',
          url: prebuiltURL
        };

        return $options.requester_fn(requesterOptions);
      }

      const parsed = url.parse(prebuiltURL);
      const httpsOptions: HttpsRequestOptions = {
        headers,
        hostname: parsed.hostname || 'api.bitbucket.org',
        method: 'GET',
        path: parsed.path || '/',
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
    doSend(
      apiPath: string,
      parameters: Record<string, any>,
      _httpMethod: string = 'GET',
      options: RequestOptions = $options
    ): Promise<ApiResponse> {
      const method = _httpMethod.toUpperCase();
      const { headers, hostname, port } = result.prepRequest(options);

      let query: string;
      const path = `${options.path || '/2.0'}/${apiPath.replace(/\/*$/, '')}`;
      if (method === 'POST') {
        query = JSON.stringify(parameters);
        headers['Content-Type'] = 'application/json';
        headers['Content-Length'] = query.length.toString();
      } else {
        query = querystring.stringify(parameters);
      }

      if (options.requester_fn) {
        const requesterOptions: any = {
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

      const httpsOptions: HttpsRequestOptions = {
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
    decodeResponse(response: string): any {
      if ($options.format === 'json') {
        if (!response) {
          return {};
        }
        return JSON.parse(response);
      }

      return response;
    },

    prepRequest(options: RequestOptions): PrepRequestResult {
      const {
        hostname: _hostname = 'api.bitbucket.org',
        http_port: httpPort = 443,
        oauth_access_token: oauthAccessToken = '',
        proxy_host: proxyHost = null,
        proxy_port: proxyPort = null,
        requester_fn
      } = options;
      const hostname = !requester_fn && proxyHost ? proxyHost : _hostname;
      const port = !requester_fn && proxyHost ? proxyPort || 3128 : httpPort;

      const headers: Record<string, string> = {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Bearer ${oauthAccessToken}`,
        Host: 'api.bitbucket.org',
        'User-Agent': 'NodeJS HTTP Client',
        'Content-Length': '0'
      };

      return { headers, hostname, port };
    },

    sendHttpsRequest(httpsOptions: HttpsRequestOptions, query?: string): Promise<ApiResponse> {
      let resolve: (value: ApiResponse) => void;
      let reject: (reason?: any) => void;
      const resultPromise = new Promise<ApiResponse>((_resolve, _reject) => {
        resolve = _resolve;
        reject = _reject;
      });

      const request = https.request(httpsOptions, (response) => {
        response.setEncoding('utf8');

        const rawBody: string[] = [];
        response.addListener('data', (chunk: string) => {
          rawBody.push(chunk);
        });
        response.addListener('end', () => {
          let body: any = rawBody.join('');

          if (response.statusCode && response.statusCode >= 400) {
            const contentType = response.headers['content-type'];
            if (contentType && contentType.includes('application/json')) {
              body = JSON.parse(body);
            }
            reject({ statusCode: response.statusCode, body });
            return;
          }

          body = result.decodeResponse(body);

          resolve({ statusCode: response.statusCode || 200, body });
        });

        response.addListener('error', (e: Error) => {
          reject(e);
        });

        response.addListener('timeout', () => {
          reject(new Error('Request timed out'));
        });
      });

      request.on('error', (e: Error) => {
        reject(e);
      });

      if (httpsOptions.method === 'POST' && query) {
        request.write(query);
      }

      request.end();

      return resultPromise;
    }
  };

  return result;
}
