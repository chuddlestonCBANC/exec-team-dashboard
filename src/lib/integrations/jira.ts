// Jira Integration Service
// Handles authentication, data fetching, and syncing with Jira

export interface JiraConfig {
  host: string; // e.g., 'yourcompany.atlassian.net'
  email: string;
  apiToken: string;
}

export interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    status: {
      name: string;
      id: string;
    };
    issuetype: {
      name: string;
      id: string;
    };
    priority?: {
      name: string;
    };
    created: string;
    updated: string;
    resolutiondate?: string;
    assignee?: {
      displayName: string;
      emailAddress: string;
    };
    [key: string]: any;
  };
}

export interface JiraSprint {
  id: number;
  name: string;
  state: 'future' | 'active' | 'closed';
  startDate?: string;
  endDate?: string;
  completeDate?: string;
}

export class JiraClient {
  private config: JiraConfig;
  private baseUrl: string;

  constructor(config: JiraConfig) {
    this.config = config;
    this.baseUrl = `https://${config.host}/rest/api/3`;
  }

  private getAuthHeader(): string {
    const credentials = Buffer.from(`${this.config.email}:${this.config.apiToken}`).toString('base64');
    return `Basic ${credentials}`;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
      'Authorization': this.getAuthHeader(),
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`Jira API Error: ${error.errorMessages?.[0] || error.message || response.statusText}`);
    }

    return response.json();
  }

  // Test the connection
  async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest('/myself');
      return true;
    } catch (error) {
      console.error('Jira connection test failed:', error);
      return false;
    }
  }

  // Search issues with JQL
  async searchIssues(jql: string, maxResults: number = 100): Promise<JiraIssue[]> {
    const params = new URLSearchParams();
    params.append('jql', jql);
    params.append('maxResults', maxResults.toString());

    // Use the new /search/jql endpoint (v3 API)
    const response = await this.makeRequest(`/search/jql?${params.toString()}`);
    return response.issues || [];
  }

  // Get issues for a specific sprint
  async getSprintIssues(sprintId: number): Promise<JiraIssue[]> {
    const jql = `sprint = ${sprintId}`;
    return this.searchIssues(jql);
  }

  // Get engineering velocity metrics
  async getVelocityMetrics(projectKey: string, startDate: Date, endDate: Date): Promise<{
    issuesCompleted: number;
    storyPointsCompleted: number;
    averageCycleTime: number; // in days
    bugsCreated: number;
    bugsResolved: number;
  }> {
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Get completed issues
    const completedJql = `project = ${projectKey} AND resolutiondate >= "${startDateStr}" AND resolutiondate <= "${endDateStr}" AND status = Done`;
    const completedIssues = await this.searchIssues(completedJql);

    // Get bugs created
    const bugsCreatedJql = `project = ${projectKey} AND issuetype = Bug AND created >= "${startDateStr}" AND created <= "${endDateStr}"`;
    const bugsCreated = await this.searchIssues(bugsCreatedJql);

    // Get bugs resolved
    const bugsResolvedJql = `project = ${projectKey} AND issuetype = Bug AND resolutiondate >= "${startDateStr}" AND resolutiondate <= "${endDateStr}"`;
    const bugsResolved = await this.searchIssues(bugsResolvedJql);

    // Calculate story points and cycle time
    let totalStoryPoints = 0;
    let totalCycleTime = 0;
    let issuesWithCycleTime = 0;

    completedIssues.forEach((issue) => {
      // Story points might be in a custom field (commonly 'customfield_10016')
      const storyPoints = issue.fields.customfield_10016 || issue.fields.storyPoints || 0;
      totalStoryPoints += parseFloat(storyPoints);

      if (issue.fields.created && issue.fields.resolutiondate) {
        const created = new Date(issue.fields.created);
        const resolved = new Date(issue.fields.resolutiondate);
        const cycleTime = (resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24); // days
        totalCycleTime += cycleTime;
        issuesWithCycleTime += 1;
      }
    });

    return {
      issuesCompleted: completedIssues.length,
      storyPointsCompleted: totalStoryPoints,
      averageCycleTime: issuesWithCycleTime > 0 ? totalCycleTime / issuesWithCycleTime : 0,
      bugsCreated: bugsCreated.length,
      bugsResolved: bugsResolved.length,
    };
  }

  // Get current sprint for a board
  async getCurrentSprint(boardId: number): Promise<JiraSprint | null> {
    try {
      const response = await fetch(
        `https://${this.config.host}/rest/agile/1.0/board/${boardId}/sprint?state=active`,
        {
          headers: {
            'Authorization': this.getAuthHeader(),
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) return null;

      const data = await response.json();
      return data.values?.[0] || null;
    } catch (error) {
      console.error('Error fetching current sprint:', error);
      return null;
    }
  }

  // Get projects
  async getProjects(): Promise<any[]> {
    const response = await this.makeRequest('/project/search');
    return response.values || [];
  }

  // Get issue types for configuration
  async getIssueTypes(projectKey: string): Promise<any[]> {
    const response = await this.makeRequest(`/project/${projectKey}/statuses`);
    return response || [];
  }

  // Get open P0/P1 issues count
  async getCriticalIssuesCount(projectKey: string): Promise<number> {
    const jql = `project = ${projectKey} AND status != Done AND priority in (Highest, High)`;
    const issues = await this.searchIssues(jql);
    return issues.length;
  }

  // Get team capacity metrics
  async getTeamMetrics(projectKey: string): Promise<{
    totalIssues: number;
    inProgress: number;
    blocked: number;
    done: number;
  }> {
    const allJql = `project = ${projectKey} AND sprint in openSprints()`;
    const allIssues = await this.searchIssues(allJql);

    const metrics = {
      totalIssues: allIssues.length,
      inProgress: 0,
      blocked: 0,
      done: 0,
    };

    allIssues.forEach((issue) => {
      const status = issue.fields.status.name.toLowerCase();
      if (status.includes('in progress') || status.includes('in review')) {
        metrics.inProgress += 1;
      } else if (status.includes('blocked')) {
        metrics.blocked += 1;
      } else if (status.includes('done') || status.includes('closed')) {
        metrics.done += 1;
      }
    });

    return metrics;
  }

  // Execute custom JQL query and aggregate results
  async executeQueryWithAggregation(
    jql: string,
    aggregationMethod: 'sum' | 'count' | 'average' | 'max' | 'min',
    valueField?: string
  ): Promise<number> {
    const issues = await this.searchIssues(jql);

    if (aggregationMethod === 'count') {
      return issues.length;
    }

    if (!valueField) {
      throw new Error('valueField is required for aggregation methods other than count');
    }

    // Extract values from the specified field
    const values: number[] = [];
    issues.forEach((issue) => {
      // Support nested fields like customfield_10016 (story points)
      let value = issue.fields[valueField];

      // Handle common field aliases
      if (!value && valueField === 'storyPoints') {
        value = issue.fields.customfield_10016 || issue.fields.story_points || 0;
      }

      if (typeof value === 'number') {
        values.push(value);
      } else if (typeof value === 'string') {
        const parsed = parseFloat(value);
        if (!isNaN(parsed)) {
          values.push(parsed);
        }
      }
    });

    if (values.length === 0) {
      return 0;
    }

    switch (aggregationMethod) {
      case 'sum':
        return values.reduce((acc, val) => acc + val, 0);
      case 'average':
        return values.reduce((acc, val) => acc + val, 0) / values.length;
      case 'max':
        return Math.max(...values);
      case 'min':
        return Math.min(...values);
      default:
        return 0;
    }
  }
}

// Helper function to create Jira client from config
export function createJiraClient(config: JiraConfig): JiraClient {
  return new JiraClient(config);
}
