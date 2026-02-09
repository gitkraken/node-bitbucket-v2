export interface ApiResponse<T = any> {
  statusCode: number;
  body: T;
}

export interface PaginatedResponse<T = any> {
  size?: number;
  page?: number;
  pagelen?: number;
  next?: string;
  previous?: string;
  values?: T[];
}

export interface RequestOptions {
  protocol?: string;
  path?: string;
  hostname?: string;
  format?: string;
  user_agent?: string;
  http_port?: number;
  timeout?: number;
  login_type?: string;
  username?: string | null;
  password?: string | null;
  api_token?: string | null;
  oauth_access_token?: string | null;
  proxy_host?: string | null;
  proxy_port?: number | null;
  requester_fn?: RequesterFunction | null;
}

export interface RequesterOptions {
  headers: Record<string, string>;
  hostname?: string;
  method: string;
  path?: string;
  query?: string;
  url: string;
  body?: any;
}

export type RequesterFunction = (options: RequesterOptions) => Promise<ApiResponse>;

export interface BitbucketConstructorOptions {
  proxy?: string;
  requesterFn?: RequesterFunction;
}

// Bitbucket API Response Types
// NOTE many of these properties are no longer documented as of 2026-01-29; they will be marked as appropriate.

export interface BitbucketBranch {
  name: string;
  target?: {
    hash?: string;
  };
}

export interface BitbucketEmail {
  // This route's ENTIRE non-error response is undocumented as of 2026-01-29
  type: 'email';
  links: Array<Record<string, any>>;
  email: string;
  is_primary: boolean;
  is_confirmed: boolean;
}

export interface BitbucketPullRequest {
  author: BitbucketUser;
  created_on: string;
  description?: string;
  destination: BitbucketPullRequestRef;
  id: number;
  links: {
    html: { href: string };
  };
  source: BitbucketPullRequestRef;
  reviewers?: Array<{ avatar_url: string; name: string; html_url: string }>;
  title: string;
  updated_on: string;
}

// NOTE: Some or all fields are undefined if the source of the PR is private and the requester does not have access.
//       It is recommended to first check if the `repository` exists, and use fallback data if not.
export interface BitbucketPullRequestRef {
  branch?: {
    name?: string;
  };

  repository?: Partial<BitbucketRepository>; // TODO check how complete this is
}

export interface BitbucketRepository {
  uuid: string;
  full_name: string;
  size: number;
  slug: string;
  is_private: boolean;
  mainbranch?: {
    name: string;
  };
  parent?: Partial<BitbucketRepository> & { full_name: string }; // undocumented; TODO check how complete this is
  workspace: BitbucketWorkspace;
  links: {
    clone: Array<{ name: string; href: string }>;
    forks: { href: string };
    html: { href: string };
    self: { href: string };
  };
  scm: 'git'; // Bitbucket stopped supporting Mercurial ('hg') in 2020
}

export interface BitbucketUser {
  uuid: string;
  account_id: string; // undocumented
  username: string; // undocumented
  nickname?: string; // undocumented
  display_name: string;
  links: {
    avatar: { href: string };
    html: { href: string }; // undocumented
  };
}

export interface BitbucketWorkspace {
  type: 'workspace_access';
  administrator: boolean;
  workspace: {
    type: 'workspace_base';
    uuid: string;
    slug: string;
    links: {
      avatar: {
        href: string;
      },
      self: {
        href: string;
      },
    },
  }
}

// Input types for API methods

export interface Repository {
  name: string;
  is_private: boolean;
  description?: string;
  fork_policy?: string;
  language?: string;
  has_issues?: boolean;
  has_wiki?: boolean;
  scm?: string;
  project?: {
    key: string;
  };
}

export interface PullRequest {
  title: string;
  description?: string;
  source: {
    branch: {
      name: string;
    };
    repository?: {
      full_name: string;
    };
  };
  destination: {
    branch: {
      name: string;
    };
  };
  close_source_branch?: boolean;
  reviewers?: Array<{ uuid: string }>;
}

export interface GetPullRequestsOptions {
  state?: string | string[];
  fields?: string[];
}
