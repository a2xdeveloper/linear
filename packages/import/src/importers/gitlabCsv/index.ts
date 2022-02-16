import * as inquirer from "inquirer";

import { Importer } from "../../types";
import { GitlabCsvImporter } from "./GitlabCsvImporter";

const BASE_PATH = process.cwd();

export const gitlabCsvImporter = async (): Promise<Importer> => {
  const answers = await inquirer.prompt<GitlabImportAnswers>(questions);
  const gitlabImporter = new GitlabCsvImporter(answers.gitlabFilePath);
  return gitlabImporter;
};

interface GitlabImportAnswers {
  gitlabFilePath: string;
}

const questions = [
  {
    basePath: BASE_PATH,
    type: "filePath",
    name: "gitlabFilePath",
    message: "Select your exported CSV file of Gitlab issues",
  },
];
