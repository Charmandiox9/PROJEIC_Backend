import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class GithubService {
  private readonly GITHUB_URL = 'https://api.github.com/graphql';

  async getCommitHistory(token: string, owner: string, name: string, branch: string = 'main') {
    const query = `
      query($owner: String!, $name: String!, $branch: String!) {
        repository(owner: $owner, name: $name) {
          ref(qualifiedName: $branch) {
            target {
              ... on Commit {
                history(first: 20) {
                  totalCount
                  edges {
                    node {
                      oid
                      message
                      additions
                      deletions
                      committedDate
                      author {
                        name
                        user { login avatarUrl }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    try {
      const response = await fetch(this.GITHUB_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: { owner, name, branch },
        }),
      });

      const result = await response.json();

      if (result.errors) {
        throw new HttpException(result.errors[0].message, HttpStatus.BAD_REQUEST);
      }

      const history = result.data.repository.ref?.target.history;
      if (!history) return null;

      const stats = history.edges.reduce(
        (
          acc: { totalAdditions: number; totalDeletions: number },
          { node }: any // 👈 Soluciona el error de desestructuración
        ) => {
          acc.totalAdditions += node.additions;
          acc.totalDeletions += node.deletions;
          return acc;
        },
        { totalAdditions: 0, totalDeletions: 0 }
      );

      return {
        totalCommits: history.totalCount,
        stats,
        commits: history.edges.map((e: any) => e.node), 
      };

    } catch (error) {
      throw new HttpException(
        error.message || 'Error al conectar con GitHub',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}