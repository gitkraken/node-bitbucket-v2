export const constants = {
  pullRequest: {
    states: {
      DECLINED: 'DECLINED' as const,
      MERGED: 'MERGED' as const,
      OPEN: 'OPEN' as const
    }
  }
};

export type PullRequestState = (typeof constants.pullRequest.states)[keyof typeof constants.pullRequest.states];
