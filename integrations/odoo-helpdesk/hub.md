# Odoo Helpdesk Integration

Connect your Botpress chatbot with Odoo Helpdesk to manage tickets and customers directly from your bot. This integration enables you to create, fetch, and update helpdesk tickets and customer records, making it easy to provide customer support through your chatbot.

## Configuration

### Prerequisites

- An Odoo instance with the Helpdesk module installed
- Odoo user credentials with appropriate permissions to manage tickets and customers
- Access to your Odoo API URL

### Setup

1. **Enable the integration** in your Botpress workspace
2. **Configure the integration** with the following required fields:
   - **Odoo API URL**: The base URL of your Odoo instance (e.g., `https://your-odoo-instance.com`)
   - **Odoo Database**: The name of your Odoo database (case-sensitive)
   - **Odoo Email**: The email address of your Odoo user account
   - **Odoo Password**: The password for your Odoo user account (stored securely as a secret)
3. **Save the configuration** - The integration will automatically register and cache helpdesk teams and stages

## Usage

### Customer Management

#### Create Customer

Create a new customer in Odoo with their contact information.

**Input:**
- `id` (required): A unique identifier for the customer in your Botpress system
- `email` (required): The customer's email address
- `name` (required): The customer's name
- `phone` (required): The customer's phone number

**Output:**
- `odooId`: The Odoo ID of the created customer

**Example:**
```json
{
  "id": "customer-123",
  "email": "john.doe@example.com",
  "name": "John Doe",
  "phone": "+1234567890"
}
```

#### Fetch Customer By ID

Retrieve a customer using their Botpress ID. The integration automatically maps Botpress IDs to Odoo IDs.

**Input:**
- `id` (required): The Botpress customer ID

**Output:**
- `customer`: The customer object with Odoo ID, email, name, and phone

#### Fetch Customer By Odoo ID

Retrieve a customer using their Odoo ID directly.

**Input:**
- `id` (required): The Botpress customer ID (optional, for mapping)
- `odooId` (required): The Odoo customer ID

**Output:**
- `customer`: The customer object

#### Fetch Customer By Email

Retrieve a customer by their email address.

**Input:**
- `email` (required): The customer's email address

**Output:**
- `customer`: The customer object

#### Update Customer By ID

Update an existing customer's information using their Botpress ID.

**Input:**
- `id` (required): The Botpress customer ID
- `email` (optional): New email address
- `name` (optional): New name
- `phone` (optional): New phone number

**Output:**
- `success`: Boolean indicating if the update was successful
- `error`: Error message if the update failed

#### Update Customer By Email

Update an existing customer's information using their email address.

**Input:**
- `email` (required): The customer's email address
- `name` (optional): New name
- `phone` (optional): New phone number

**Output:**
- `success`: Boolean indicating if the update was successful
- `error`: Error message if the update failed

### Ticket Management

#### Create Ticket

Create a new helpdesk ticket in Odoo.

**Input:**
- `name` (required): The ticket title/subject
- `description` (required): The ticket description/details
- `teamId` (required): The ID of the helpdesk team to assign the ticket to (minimum: 1)
- `customerOdooId` (required): The Odoo ID of the customer associated with the ticket
- `priority` (optional): Priority level - `"0"` (lowest), `"1"`, `"2"`, or `"3"` (highest)
- `stageId` (required): The ID of the initial ticket stage

**Output:**
- `ticketId`: The ID of the created ticket

**Example:**
```json
{
  "name": "Unable to access account",
  "description": "Customer reports login issues",
  "teamId": 1,
  "customerOdooId": 42,
  "priority": "2",
  "stageId": 1
}
```

#### Fetch Ticket By ID

Retrieve a ticket by its ID.

**Input:**
- `id` (required): The ticket ID

**Output:**
- `ticket`: The ticket object with all details including customer, team, priority, and stage

#### Fetch Tickets By Customer ID

Retrieve all tickets associated with a customer using their Odoo ID.

**Input:**
- `customerOdooId` (required): The Odoo customer ID

**Output:**
- `tickets`: Array of ticket objects

#### Fetch Tickets By Customer Email

Retrieve all tickets associated with a customer using their email address.

**Input:**
- `customerEmail` (required): The customer's email address

**Output:**
- `tickets`: Array of ticket objects

#### Update Ticket

Update an existing ticket's properties.

**Input:**
- `ticketId` (required): The ID of the ticket to update
- `name` (optional): New ticket title
- `description` (optional): New ticket description
- `teamId` (optional): New helpdesk team ID
- `priority` (optional): New priority level (`"0"`, `"1"`, `"2"`, or `"3"`)
- `stageId` (optional): New stage ID

**Output:**
- `success`: Boolean indicating if the update was successful

### Helpdesk Configuration

#### Get Helpdesk Teams

Retrieve all active helpdesk teams from your Odoo instance. Teams are cached during integration registration for improved performance.

**Input:** None

**Output:**
- `helpdeskTeams`: Array of helpdesk team objects with `id` and `name`

#### Get Stages

Retrieve all ticket stages. Optionally filter by team ID to get stages for a specific team.

**Input:**
- `teamId` (optional): Filter stages by helpdesk team ID

**Output:**
- `stages`: Array of stage objects with `id`, `name`, and `teamIds`

## Use Cases

- **Customer Support Automation**: Automatically create tickets when customers report issues through your chatbot
- **Ticket Status Updates**: Update ticket stages as issues are resolved
- **Customer Information Management**: Keep customer records synchronized between Botpress and Odoo
- **Ticket Lookup**: Allow customers to check their ticket status by email
- **Support Team Workflows**: Integrate chatbot interactions with your helpdesk team's workflow

## Limitations

- The integration requires an active Odoo instance with the Helpdesk module installed
- Customer ID mapping is stored per integration instance and is not shared across workspaces
- Authentication cookies are cached per configuration to reduce API calls, but may need to be refreshed if credentials change
- The integration does not support webhook events from Odoo (ticket updates must be polled or triggered manually)
- Rate limiting depends on your Odoo instance configuration

## Changelog

### Version 0.1.43
- Initial release of Odoo Helpdesk integration
- Customer management actions (create, fetch, update)
- Ticket management actions (create, fetch, update)
- Helpdesk configuration actions (teams, stages)
- Automatic ID mapping between Botpress and Odoo
- Cookie-based authentication with caching
