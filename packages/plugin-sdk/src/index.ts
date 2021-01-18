import { PluginFunction, PluginValidateFn, Types } from "@graphql-codegen/plugin-helpers";
import { ContextVisitor, logger, nonNullable, PluginContext, printList } from "@linear/plugin-common";
import { GraphQLSchema, parse, printSchema, visit } from "graphql";
import { extname } from "path";
import c from "./constants";
import { printModels } from "./model";
import { ModelVisitor } from "./model-visitor";
import { printOperations } from "./operation";
import { parseOperations as parseDocuments } from "./parse";
import { printRequest } from "./request";
import { printSdk } from "./sdk";
import { SdkModel, SdkPluginConfig, SdkPluginContext } from "./types";

/**
 * Graphql-codegen plugin for outputting the typed Linear sdk
 */
export const plugin: PluginFunction<SdkPluginConfig> = async (
  schema: GraphQLSchema,
  documents: Types.DocumentFile[],
  config: SdkPluginConfig
) => {
  try {
    logger.info("Parsing schema");
    const ast = parse(printSchema(schema));

    logger.info("Collecting context");
    const contextVisitor = new ContextVisitor<SdkPluginConfig>(schema, config);
    visit(ast, contextVisitor);
    const context: PluginContext<SdkPluginConfig> = {
      ...contextVisitor.context,
      fragments: [],
    };

    logger.info("Generating models");
    const modelVisitor = new ModelVisitor(context);
    const models = visit(ast, modelVisitor) as SdkModel[];

    logger.info("Processing documents");
    const sdkDefinitions = parseDocuments(context, documents, models);
    logger.debug(sdkDefinitions);
    const sdkContext: SdkPluginContext = {
      ...context,
      models,
      sdkDefinitions,
    };

    logger.info("Printing models");
    const printedModels = printModels(sdkContext);

    logger.info("Printing operations");
    const printedOperations = printOperations(sdkContext);

    logger.info("Printing sdk");
    const printedSdk = printSdk(sdkContext);

    return {
      prepend: [
        /** Ignore unused variables */
        "/* eslint-disable @typescript-eslint/no-unused-vars */",
        /** Import DocumentNode */
        "import { DocumentNode } from 'graphql'",
        /** Import document namespace */
        `import * as ${c.NAMESPACE_DOCUMENT} from '${config.documentFile}'`,
      ].filter(nonNullable),
      content: printList(
        [
          /** Print the requester function */
          printRequest(),
          /** Print the api models */
          printedModels,
          /** Print the api operations */
          printedOperations,
          /** Print the api root operations */
          printedSdk,
        ],
        "\n\n"
      ),
    };
  } catch (e) {
    logger.fatal(e);
    throw e;
  }
};

/**
 * Validate use of the plugin
 */
export const validate: PluginValidateFn = async (
  schema: GraphQLSchema,
  documents: Types.DocumentFile[],
  config: SdkPluginConfig,
  outputFile: string
) => {
  const packageName = "@linear/plugin-sdk";
  logger.info(`Validating ${packageName}`);
  logger.info({ config });

  const prefix = `Plugin "${packageName}" config requires`;

  if (extname(outputFile) !== ".ts") {
    throw new Error(`${prefix} output file extension to be ".ts" but is "${outputFile}"`);
  }

  if (!config.documentFile || typeof config.documentFile !== "string") {
    throw new Error(`${prefix} documentFile to be a string path to a document file generated by "typed-document-node"`);
  }
};
