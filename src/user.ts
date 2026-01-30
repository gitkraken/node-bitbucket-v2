import { ApiModel } from './index';
import { ApiResponse, BitbucketUser } from './types';

/**
 * API docs: https://confluence.atlassian.com/bitbucket/user-endpoint-2-0-744527199.html
 */
export default function buildUserApi(api: ApiModel) {
  return {
    /**
     * Get the info for the authenticated user
     */
    get: (): Promise<ApiResponse<BitbucketUser>> => api.get('user')
  };
}
