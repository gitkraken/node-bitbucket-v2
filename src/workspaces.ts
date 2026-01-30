import { ApiModel } from './index';
import { ApiResponse, BitbucketWorkspace, PaginatedResponse } from './types';

/**
 * API docs: http://developer.atlassian.com/cloud/bitbucket/rest/api-group-workspaces
 */
export default function buildWorkspacesApi(api: ApiModel) {
  return {
    /**
     * Get the workspaces for the authenticated user
     */
    get: (): Promise<ApiResponse<PaginatedResponse<BitbucketWorkspace>>> => api.get('user/workspaces')
  };
}
