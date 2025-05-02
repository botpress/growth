export const TABLE_SCHEMA = {
    type: 'object',
    properties: {
        question: {
            type: 'string',
            'x-zui': { searchable: true }
        },
        count: {
            type: 'number'
        }
    },
    required: ['question', 'count']
}

export const TABLE_NAME = 'QuestionTable'