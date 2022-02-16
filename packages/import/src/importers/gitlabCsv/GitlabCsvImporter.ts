import csv from "csvtojson";
import { Importer, ImportResult } from "../../types";

interface GitlabIssueType {
  "Issue ID": string;
  URL: string;
  Title: string;
  State: string;
  Description: string;
  Author: string;
  "Author Username": string;
  Assignee: string;
  "Assignee Username": string;
  Confidential: string;
  Locked: string;
  "Due Date": string;
  "Created At (UTC)": string;
  "Updated At (UTC)": string;
  "Closed At (UTC)": string;
  Milestone: string;
  Weight: string;
  Labels: string;
  "Time Estimate": string;
  "Time Spent": string;
  "Epic ID": string;
  "Epic Title": string;
}

/**
 * Import issues from Linear CSV export.
 *
 * @param filePath  path to csv file
 */
export class LinearCsvImporter implements Importer {
  public constructor(filePath: string) {
    this.filePath = filePath;
  }

  public get name(): string {
    return "Gitlab (CSV)";
  }

  public get defaultTeamName(): string {
    return "Gitlab";
  }

  public import = async (): Promise<ImportResult> => {
    const data = (await csv().fromFile(this.filePath)) as GitlabIssueType[];

    const importData: ImportResult = {
      issues: [],
      labels: {},
      users: {},
      statuses: {},
    };

    const assignees = Array.from(new Set(data.map(row => row.Assignee)));

    for (const user of assignees) {
      importData.users[user] = {
        name: user,
      };
    }

    for (const row of data) {
      const tags = row.Labels.split(",");
      const labels = tags.filter(tag => !!tag);

      importData.issues.push({
        title: row.Title,
        description: row.Description,
        url: row.URL,
        assigneeId: row.Assignee,
        labels,
      });

      for (const lab of labels) {
        if (!importData.labels[lab]) {
          importData.labels[lab] = {
            name: lab,
          };
        }
      }
    }

    return importData;
  };

  // -- Private interface

  private filePath: string;
}
