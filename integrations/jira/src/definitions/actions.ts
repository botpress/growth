import {
  findUserInputSchema,
  findUserOutputSchema,
  newIssueInputSchema,
  newIssueOutputSchema,
  updateIssueInputSchema,
  updateIssueOutputSchema,
  addCommentToIssueInputSchema,
  addCommentToIssueOutputSchema,
  findAllUsersInputSchema,
  findAllUsersOutputSchema,
} from '../misc/custom-schemas'

const findUser = {
  title: 'Find User',
  description: 'Find user by Account ID',
  input: {
    schema: findUserInputSchema,
  },
  output: {
    schema: findUserOutputSchema,
  },
}

const newIssue = {
  title: 'New Issue',
  description: 'Create a new issue in Jira',
  input: {
    schema: newIssueInputSchema,
    ui: {
      issueType: {
        examples: ['Bug', 'Task', 'Story', 'Subtask', 'Epic'],
      },
    },
  },
  output: {
    schema: newIssueOutputSchema,
  },
}

const updateIssue = {
  title: 'Update Issue',
  description: 'Update a issue in Jira',
  input: {
    schema: updateIssueInputSchema,
    ui: {
      issueType: {
        examples: ['Bug', 'Task', 'Story', 'Subtask', 'Epic'],
      },
    },
  },
  output: {
    schema: updateIssueOutputSchema,
  },
}

const addCommentToIssue = {
  title: 'Add Comment To Issue',
  description: 'Add comment to issue in Jira',
  input: {
    schema: addCommentToIssueInputSchema,
  },
  output: {
    schema: addCommentToIssueOutputSchema,
  },
}

const findAllUsers = {
  title: 'Find All Users',
  description: 'Find All Users',
  input: {
    schema: findAllUsersInputSchema,
  },
  output: {
    schema: findAllUsersOutputSchema,
  },
}

export const actions = {
  findUser,
  newIssue,
  updateIssue,
  addCommentToIssue,
  findAllUsers,
}
