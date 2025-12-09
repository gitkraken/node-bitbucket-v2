const constants = require('./constants');
const { extractResponseBody } = require('./helpers');

/**
 * API docs: https://confluence.atlassian.com/bitbucket/repositories-endpoint-423626330.html
 *           https://confluence.atlassian.com/bitbucket/repository-resource-423626331.html
 */
module.exports = function RepositoriesApi(api) {
  return {
    /**
     * Create a new repository
     * @param {String} workspace workspace UUID or slug
     * @param {Object} repo repo metadata as specified by Bitbucket's API documentation.
     *                         NOTE Unlike the normal API, Including an explicit name property in repo is REQUIRED!!
     *                         Due to limitations in the API, the slug is derived from the repo name within this method.
     */
    create: (workspace, repo) => {
      if (!repo || typeof repo.isPrivate !== 'boolean' || typeof repo.name !== 'string') {
        throw new Error('Repo must be initialized with a booelan privacy setting and a string name');
      }

      // NOTE the below comment has been clarified by TJ Kells at bitbucket - slugification is implemented here:
      // https://docs.djangoproject.com/en/1.11/_modules/django/utils/text/#slugify
      // Someday the below could be updated to precisely re-implement django's slugification.

      // The official API error is that slugs must be alphanumeric with underscore, dot, and dash, lowercase, and
      // no whitespace. Most things convert to dashes with Atlassian's secret converter but apostophes just disappear
      // (here I've assumed quotes are the same).
      // There are additional constraints not provided in the error message nor documented anywhere that can only be
      // found by trial and error. Among these are: no consecutive dashes except in some weird trivial edge cases
      // (i.e. all dashes, which we won't worry about), no ending in a dash, and very likely no starting in a dash.
      const repoSlug = repo.name
        .replace(/['"]/g, '')
        .replace(/\W/g, '-')
        .replace(/--+/g, '-')
        .replace(/^-/, '')
        .replace(/-$/, '')
        .toLowerCase();

      return api.post(
        `repositories/${encodeURI(workspace)}/${encodeURI(repoSlug)}`,
        repo
      );
    },

    /**
     * Create a new pull request
     *
     * @param {String} workspace workspace UUID or slug
     * @param {String} repoSlug (name) of the repo.
     * @param {Object} pullRequest The PR POST body as specified by Bitbucket's API documentation
     */
    createPullRequest: (workspace, repoSlug, pullRequest) => api.post(
      `repositories/${encodeURI(workspace)}/${encodeURI(repoSlug)}/pullrequests`,
      pullRequest
    ),

    /**
     * Get the info for a single repo
     *
     * @param {String} workspace workspace UUID or slug
     * @param {String} slug (name) of the repo.
     */
    get: (workspace, repoSlug) => api.get(`repositories/${encodeURI(workspace)}/${encodeURI(repoSlug)}`),

    /**
     * Get the branch info for a single repo
     *
     * @param {String} workspace workspace UUID or slug
     * @param {String} slug (name) of the repo.
     */
    getBranches: (workspace, repoSlug) => api
      .get(`repositories/${encodeURI(workspace)}/${encodeURI(repoSlug)}/refs/branches`),

    /**
     * Get a single commit
     * @param {String} workspace workspace UUID or slug
     * @param {String} slug (name) of the repo.
     * @param {String} the sha of the commit
     */
    getCommit: (workspace, repoSlug, sha) => api
      .get(`repositories/${encodeURI(workspace)}/${encodeURI(repoSlug)}/commit/${sha}`),

    /**
     * Get the pull requests for a single repo
     *
     * @param {String} workspace workspace UUID or slug
     * @param {String} slug (name) of the repo.
     * @param {constants.pullRequest.states or Array thereof} The PR state. If invalid or undefined, defaults to OPEN
     */
    getPullRequests: (workspace, repoSlug, state) => {
      let stateArray = state;
      if (!stateArray) {
        stateArray = [constants.pullRequest.states.OPEN];
      }
      else if (!Array.isArray(stateArray)) {
        stateArray = [stateArray];
      }

      const hasInvalidState = stateArray.find((stateElement) => !constants.pullRequest.states[stateElement]);
      if (hasInvalidState) {
        stateArray = [constants.pullRequest.states.OPEN];
      }

      const apiParameters = {
        state: stateArray.join(',')
      };

      return api.get(
        `repositories/${encodeURI(workspace)}/${encodeURI(repoSlug)}/pullrequests`,
        apiParameters
      );
    },

    /**
     * Get the pull requests for a single repo, with the destination and source repos on each pull requests totally
     * populated.
     *
     * @param {String} workspace workspace UUID or slug
     * @param {String} repoSlug (name) of the repo.
     * @param {Object} options The fields to populate, and optionally the PR state (defaults to OPEN)
     */
    getPullRequestsWithFields: (workspace, repoSlug, { state, fields } = {}) => {
      if (!Array.isArray(fields) || fields.length < 1) {
        throw new Error('getPullRequestsWithFields: options argument missing or has missing/empty \'fields\' array.');
      }

      let stateArray = state;
      if (!stateArray) {
        stateArray = [constants.pullRequest.states.OPEN];
      }
      else if (!Array.isArray(stateArray)) {
        stateArray = [stateArray];
      }

      const hasInvalidState = stateArray.find((stateElement) => !constants.pullRequest.states[stateElement]);
      if (hasInvalidState) {
        stateArray = [constants.pullRequest.states.OPEN];
      }

      const apiParameters = {
        state: stateArray.join(',')
      };

      const fieldsWithEncodedPlus = fields.map((field) => `+${field}`);
      apiParameters.fields = fieldsWithEncodedPlus.join(',');

      return api.get(
        `repositories/${encodeURI(workspace)}/${encodeURI(repoSlug)}/pullrequests`, // eslint-disable-line max-len
        apiParameters
      );
    },

    /**
     * Get the repositories of a workspace
     *
     * @param {String} workspace workspace UUID or slug
     */
    getByWorkspace: (workspace) => api.get(`repositories/${encodeURI(workspace)}`),

    /**
     * Get the forks for a repo
     *
     * @param {String} workspace workspace UUID or slug
     * @param {String} repoSlug (name) of the repo.
     */
    getForks: (workspace, repoSlug) => api.get(`repositories/${encodeURI(workspace)}/${encodeURI(repoSlug)}/forks`),

    /**
     * Get the forks for a repo using an API response that has repository links
     *
     * @param {Object} response API response, or its `body` property
     */
    getForksFromResponse: (response) => {
      const prebuiltURL = extractResponseBody(response)?.links?.forks?.href;

      if (!prebuiltURL) {
        throw new Error('getForksFromResponse: argument has no \'forks\' url.');
      }

      return api.request.doPrebuiltSend(prebuiltURL);
    },

    /**
     * Get the parent for a repo using an API response that has repository links.
     * This should only be called after a check to hasParent().
     *
     * @param {Object} response API response, or its `body` property
     */
    getParentFromResponse: (response) => {
      const prebuiltURL = extractResponseBody(response)?.parent?.links?.self?.href;

      if (!prebuiltURL) {
        throw new Error(
          'getForksFromResponse: argument has no \'parent\' info. Call hasParent first to guard this method call.'
        );
      }

      return api.request.doPrebuiltSend(prebuiltURL);
    },

    /**
     * Determines whether or not the given response has an accessible parent.
     *
     * @param {Object} response API response, or its `body` property
     * @return {boolean} true if the argument has an associated "parent" (i.e. the response is a fork), false otherwise.
     */
    hasParent: (response) => Boolean(extractResponseBody(response).parent)
  };
};
