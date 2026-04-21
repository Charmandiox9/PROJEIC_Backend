import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class GithubService {    
  private readonly GQL_URL = 'https://api.github.com/graphql';
  private readonly REST_URL = 'https://api.github.com/repos';

  private getHeaders(token: string) {
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github.v3+json',
    };
  }

  async getCommitHistory(token: string, owner: string, name: string, branch: string) {
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
                      author { name user { login avatarUrl } }
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
      const response = await fetch(this.GQL_URL, {
        method: 'POST',
        headers: this.getHeaders(token),
        body: JSON.stringify({ query, variables: { owner, name, branch } }),
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

  async getWorkflowRuns(token: string, owner: string, repo: string) {
    const res = await fetch(`${this.REST_URL}/${owner}/${repo}/actions/runs?per_page=5`, {
      headers: this.getHeaders(token),
    });
    const data = await res.json();
    return data.workflow_runs || [];
  }

  async dispatchWorkflow(token: string, owner: string, repo: string, workflowId: string, ref: string) {
    const res = await fetch(`${this.REST_URL}/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`, {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify({ ref }),
    });
    if (!res.ok) throw new Error('No se pudo iniciar el flujo');
    return { success: true, message: 'Workflow disparado' };
  }

  async getArtifacts(token: string, owner: string, repo: string) {
    const res = await fetch(`${this.REST_URL}/${owner}/${repo}/actions/artifacts?per_page=10`, {
      headers: this.getHeaders(token),
    });
    
    if (!res.ok) {
      console.error('Error fetching artifacts');
      return [];
    }
    
    const data = await res.json();
    return data.artifacts || [];
  }

  async downloadArtifact(token: string, owner: string, repo: string, artifactId: string) {
    const res = await fetch(`${this.REST_URL}/${owner}/${repo}/actions/artifacts/${artifactId}/zip`, {
      headers: this.getHeaders(token),
    });

    if (!res.ok) throw new Error('No se pudo descargar el artefacto');
    
    return res.arrayBuffer(); 
  }
}