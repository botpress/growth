import {
  CreateCaseInputSchema,
  CreateCaseOutputSchema,
  DeleteCaseInputSchema,
  DeleteCaseOutputSchema,
  SearchCasesInputSchema,
  SearchCasesOutputSchema,
  UpdateCaseInputSchema,
  UpdateCaseOutputSchema,
} from "src/misc/custom-schemas/case-schemas";
import {
  CreateCaseUi,
  DeleteCasesUi,
  SearchCasesUi,
  UpdateCaseUi,
} from "src/misc/custom-uis/case-uis";

const createCase = {
  title: "Create Case",
  description: "Create a Salesforce Case",
  input: {
    schema: CreateCaseInputSchema,
    ui: CreateCaseUi,
  },
  output: {
    schema: CreateCaseOutputSchema,
  },
};

const updateCase = {
  title: "Update Case",
  description: "Update a Salesforce Case",
  input: {
    schema: UpdateCaseInputSchema,
    ui: UpdateCaseUi,
  },
  output: {
    schema: UpdateCaseOutputSchema,
  },
};

const deleteCase = {
  title: "Delete Case",
  description: "Delete Salesforce Case",
  input: {
    schema: DeleteCaseInputSchema,
    ui: DeleteCasesUi,
  },
  output: {
    schema: DeleteCaseOutputSchema,
  },
};

const searchCases = {
  title: "Search Cases",
  description: "Search Salesforce Cases",
  input: {
    schema: SearchCasesInputSchema,
    ui: SearchCasesUi,
  },
  output: {
    schema: SearchCasesOutputSchema,
  },
};

export const caseActionDefinitions = {
  createCase,
  updateCase,
  deleteCase,
  searchCases,
};
