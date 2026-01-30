import { ApiResponse } from './types';

type ExtractedBodyIfAble<R> = R extends ApiResponse<infer T> ? T : R;

export function extractResponseBody<R extends object | null | undefined>(response: R): ExtractedBodyIfAble<R> {
  if (!response || !('body' in response && 'statusCode' in response)) {
    return response as ExtractedBodyIfAble<R>;
  }

  return (response as ApiResponse).body;
}
