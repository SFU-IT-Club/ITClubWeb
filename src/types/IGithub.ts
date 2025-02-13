export type GithubRepoType = {
    name: string;
    default_branch: string;
    owner: string;
    contributors: string[];
    url: string;
    created_at: string;
}

export type GithubContributorType = {
    login: string | undefined;
}