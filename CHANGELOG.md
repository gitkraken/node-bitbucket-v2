# CHANGELOG

## 1.0.1
 - Fixed `BitbucketWorkspace` type to document what is returned by the new `.worspaces.get` function.

## 1.0.0
 - **BREAKING CHANGE**: Node 7.6 is no longer supported; only Node 22 and up is now supported.
 - **BREAKING CHANGE**: Module export changed: use `require('bitbucket-v2').default` in CommonJS (was `require('bitbucket-v2')`).
 - **BREAKING CHANGE**: Constructor is now a function call, not a class - use `Bitbucket(options)` instead of `new Bitbucket(options)`
 - **BREAKING CHANGE**: Moved `.workspaces.get` off of deprecated `/workspaces` route and onto new `/user/workspaces` route. The return value has changed and your existing usage will need to be adjusted.
 - Transferred ownership of the repository to the "GitKraken" GitHub organization.
 - Converted entire codebase to Typescript. The types for API responses have been defined according to current usage within the author's workplace, and will be missing _many_ properties. If you encounter a problem, please open a pull request with expanded type definitions.

## 0.6.0
Thanks to [@andrewyalung](https://github.com/andrewyalung/) for authoring most of this version!
 - `requesterFn` has been added as an option. When `requesterFn` is provided, all request will be processed by that function.
 - `useXhr` has been removed and replaced with `requesterFn`.
 - Fixed non-default `port` being ignored in default request implementation.

## 0.5.2
 - Functions that take an API response as an argument now properly handle taking the _entire_ response, as they did in `0.4.x`. They _also_ still accept just the response's `body` property, as in `0.5.1`. Affected functions: `hasNextPage`, `hasPreviousPage`, `getNextPage`, `getPreviousPage`, `repositories.getForksFromResponse`, `repositories.hasParent`, `repositories.getParentFromResponse`.

## 0.5.1
This version is targeted at two main goals:
1. Bitbucket's _breaking_ API changes (migrating from users and teams to "workspaces"), in order to comply with GDPR. For more details, see: https://developer.atlassian.com/cloud/bitbucket/bitbucket-api-changes-workspaces/
2. Modernizing the code from node-callbacks to promises.

Due to the aforementioned breaking changes on Bitbucket's end, usage of previous versions of this package will stop working in general after 2020-04-29, except for a few basic uses like getting the authenticated user.

 - Started CHANGELOG document.
 - Added Node 7.6 requirement.
 - All asynchronous functions now return a promise, and no longer accept a callback.
 - On success, the old response will now be packed inside a `body` property, and it now has a sibling `statusCode` property.
 - On errors that result from API responses, the response body will now be on a property called `body` (instead of `msg`), and `status` has been renamed to `statusCode`.
 - When `useXhr` is enabled, the entire XHR response will now be provided on both success and failure. Note that this is consistent with the `body` and `statusCode` properties previously described.
 - `repositories.getByUser` and `repositories.getByTeam` have been merged to `repositories.getByWorkspace`.
 - `teams.get` has been removed.
 - `workspaces.get` has been added.
 - Fixed a bug where double JSON parsing would cause parsing to throw an error. Thanks to @mateusmcg for the fix!
