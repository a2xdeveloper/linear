import * as inquirer from "inquirer";

import { Importer } from "../../types";
import { LinearCsvImporter } from "./GitlabCsvImporter";

const BASE_PATH = process.cwd();

export const gitlabCsvImporter = async (): Promise<Importer> => {
  const answers = await inquirer.prompt<LinearImportAnswers>(questions);
  const linearImporter = new LinearCsvImporter(answers.linearFilePath);
  return linearImporter;
};

interface LinearImportAnswers {
  linearFilePath: string;
}

const questions = [
  {
    basePath: BASE_PATH,
    type: "filePath",
    name: "linearFilePath",
    message: "Select your exported CSV file of Gitlab issues",
  },
];
