import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class DocRouterAccountApi implements ICredentialType {
	name = 'docRouterAccountApi';

	displayName = 'DocRouter Account API';

	icon: Icon = { light: 'file:../icons/docrouter.svg', dark: 'file:../icons/docrouter.dark.svg' };

	documentationUrl = 'https://app.docrouter.ai';

	properties: INodeProperties[] = [
		{
			displayName: 'Account API Token',
			name: 'apiToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description: 'Your DocRouter account-level API token (for admin operations).',
		},
		{
			displayName: 'API Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://app.docrouter.ai/fastapi',
			description:
				'Override the DocRouter API base URL (e.g. for self-hosted or staging). Leave default for DocRouter cloud.',
			placeholder: 'https://app.docrouter.ai/fastapi',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials?.apiToken}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials?.baseUrl || "https://app.docrouter.ai/fastapi"}}',
			url: '/v0/account/llm/models',
			method: 'GET',
		},
	};
}
