# n8n-nodes-docrouter

[n8n](https://n8n.io) community nodes and credentials for [DocRouter.ai](https://app.docrouter.ai).

## Contents

### Credentials

- **DocRouter Organization API** (`docRouterOrgApi`) – Organization-level API token for documents, tags, LLM, prompts, schemas, knowledge bases. Use for workflow operations within an organization.
- **DocRouter Account API** (`docRouterAccountApi`) – Account-level API token for users and organizations. Use for account admin operations (users, orgs).

### Nodes

| Node | Description |
|------|-------------|
| **DocRouter Account** | Manage account users and organizations (list/get/create/update/delete users and organizations). |
| **DocRouter Document** | Manage documents (list, get, upload, update, delete). |
| **DocRouter Tag** | Manage tags in the organization (list, get, create, update, delete). |
| **DocRouter LLM** | Run LLM analysis and manage results (run, get, update, delete). |
| **DocRouter Prompt** | Manage prompts (create, list, get, update, delete, list versions). |
| **DocRouter Schema** | Manage schemas (create, list, get, update, delete, validate, list versions). |
| **DocRouter Knowledge Base** | Manage knowledge bases and run search/chat (list, get, create, update, delete, list documents/chunks, search, chat, reconcile). |
| **DocRouter Webhook** | Trigger workflows from DocRouter webhook events (with optional HMAC verification). |

The **Example** node is included for reference and can be removed from the package if not needed.

## Installation

### Install the package

Where n8n is installed (or in your project that runs n8n):

```bash
npm install n8n-nodes-docrouter
```

Then restart n8n.

### Or use community packages (e.g. Docker)

Set the environment variable so n8n loads the package:

```bash
N8N_COMMUNITY_PACKAGES=n8n-nodes-docrouter
```

Restart n8n after changing this.

## Setup

1. In n8n, add **DocRouter Organization API** or **DocRouter Account API** credentials (Settings → Credentials or when adding a DocRouter node).
2. **Organization API**: use an organization-level API token from DocRouter; optional base URL override for self-hosted/staging.
3. **Account API**: use an account-level API token from DocRouter for user/org operations; optional base URL override.

Base URL default: `https://app.docrouter.ai/fastapi`.

## Development

```bash
git clone https://github.com/analytiqhub/n8n-nodes-docrouter.git
cd n8n-nodes-docrouter
npm install
npm run dev
```

- `npm run build` – compile for production
- `npm run lint` / `npm run lint:fix` – lint and fix
- `npm run dev` – run n8n with nodes loaded and watch for changes

## Resources

- [DocRouter](https://app.docrouter.ai)
- [n8n node documentation](https://docs.n8n.io/integrations/creating-nodes/)
- [Repository](https://github.com/analytiqhub/n8n-nodes-docrouter)

## License

[MIT](LICENSE.md)
