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

  async getCommitHistory(
    token: string,
    owner: string,
    name: string,
    branch: string,
  ) {
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
        throw new HttpException(
          result.errors[0].message,
          HttpStatus.BAD_REQUEST,
        );
      }

      const history = result.data.repository.ref?.target.history;
      if (!history) return null;

      const stats = history.edges.reduce(
        (
          acc: { totalAdditions: number; totalDeletions: number },
          { node }: any,
        ) => {
          acc.totalAdditions += node.additions;
          acc.totalDeletions += node.deletions;
          return acc;
        },
        { totalAdditions: 0, totalDeletions: 0 },
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
    const res = await fetch(
      `${this.REST_URL}/${owner}/${repo}/actions/runs?per_page=5`,
      {
        headers: this.getHeaders(token),
      },
    );
    const data = await res.json();
    return data.workflow_runs || [];
  }

  async dispatchWorkflow(
    token: string,
    owner: string,
    repo: string,
    workflowId: string,
    ref: string,
  ) {
    const res = await fetch(
      `${this.REST_URL}/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`,
      {
        method: 'POST',
        headers: this.getHeaders(token),
        body: JSON.stringify({ ref }),
      },
    );
    if (!res.ok) throw new Error('No se pudo iniciar el flujo');
    return { success: true, message: 'Workflow disparado' };
  }

  async getArtifacts(token: string, owner: string, repo: string) {
    const res = await fetch(
      `${this.REST_URL}/${owner}/${repo}/actions/artifacts?per_page=10`,
      {
        headers: this.getHeaders(token),
      },
    );

    if (!res.ok) {
      console.error('Error fetching artifacts');
      return [];
    }

    const data = await res.json();
    return data.artifacts || [];
  }

  async downloadArtifact(
    token: string,
    owner: string,
    repo: string,
    artifactId: string,
  ) {
    const res = await fetch(
      `${this.REST_URL}/${owner}/${repo}/actions/artifacts/${artifactId}/zip`,
      {
        headers: this.getHeaders(token),
      },
    );

    if (!res.ok) throw new Error('No se pudo descargar el artefacto');

    return res.arrayBuffer();
  }

  async getPullRequests(token: string, owner: string, repo: string) {
    const res = await fetch(
      `${this.REST_URL}/${owner}/${repo}/pulls?state=open&sort=updated&direction=desc&per_page=5`,
      {
        headers: this.getHeaders(token),
      },
    );

    if (!res.ok) return [];

    const data = await res.json();
    return data.map((pr: any) => ({
      id: pr.id,
      title: pr.title,
      state: pr.state,
      html_url: pr.html_url,
      created_at: pr.created_at,
      user_login: pr.user.login,
      user_avatar: pr.user.avatar_url,
    }));
  }

  async getDeployments(token: string, owner: string, repo: string) {
    const res = await fetch(
      `${this.REST_URL}/${owner}/${repo}/deployments?per_page=5`,
      {
        headers: this.getHeaders(token),
      },
    );

    if (!res.ok) return [];

    const data = await res.json();
    return data.map((d: any) => ({
      id: d.id,
      environment: d.environment,
      ref: d.ref,
      created_at: d.created_at,
      creator_login: d.creator.login,
    }));
  }

  async getSecurityAlerts(token: string, owner: string, repo: string) {
    const res = await fetch(
      `${this.REST_URL}/${owner}/${repo}/dependabot/alerts?state=open&per_page=5`,
      {
        headers: this.getHeaders(token),
      },
    );

    if (!res.ok) return [];

    const data = await res.json();
    return data.map((alert: any) => ({
      number: alert.number,
      state: alert.state,
      severity: alert.security_advisory.severity,
      package_name: alert.security_vulnerability.package.name,
      created_at: alert.created_at,
      html_url: alert.html_url,
    }));
  }
}
