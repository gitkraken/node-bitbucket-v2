# node-bitbucket-v2
node.js library to access the Bitbucket API v2

**Note:** This library is now written in TypeScript and includes full type definitions!

## Installation

```bash
npm install bitbucket-v2
```

## Usage

### JavaScript (CommonJS)

```javascript
const Bitbucket = require('bitbucket-v2').default;
const bitbucketApi = Bitbucket(options);
```

### TypeScript

```typescript
import Bitbucket, { type BitbucketConstructorOptions } from 'bitbucket-v2';

const options: BitbucketConstructorOptions = {
  // your options here
};

const bitbucketApi = Bitbucket(options);
```

### Authentication and request

```
bitbucketApi.authenticateOAuth2(accessTokenString);

bitbucketApi.user.get().then(({ body }) => {
  console.log(body.uuid);
});
```

## Options

It is not necessary to provide any options at all (`Bitbucket` can be constructed with no argument).

 - `requesterFn` (`(options: RequesterOptions) => Promise<BitbucketResponse>`): If provided, requests will be made using the function you provide. This allows you to use your preferred http client. The `options` provided are `{ headers, hostname, method, path, query, url, body? }`. `body` is only provided on `POST` methods. In the case of `getNextPage`, `getPreviousPage`, `getForksFromResponse` and `getParentFromResponse`, only `{ headers, method, url }` are provided in the options. Example:

```typescript
import axios from 'axios';
import Bitbucket from 'bitbucket-v2';

const requesterFn = (options) => {
  const { url, method, body } = options;

  if (method === 'POST') {
    return axios.post(url, body);
  }

  return axios.get(url);
};

const bitbucketApi = Bitbucket({ requesterFn });
```

 - `proxy` (`string`): Defines a proxy to make requests against, instead of `api.bitbucket.org:443`. This option is _ignored_ when `requesterFn` is provided.


## Development

Build the TypeScript code:
```bash
npm run build
```

Run linting:
```bash
npm run lint
```
