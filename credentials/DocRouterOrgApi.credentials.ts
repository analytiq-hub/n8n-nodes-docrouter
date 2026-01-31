import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class DocRouterOrgApi implements ICredentialType {
	name = 'docRouterOrgApi';

	displayName = 'DocRouter Organization API';

	icon: Icon = { light: 'file:../icons/docrouter.svg', dark: 'file:../icons/docrouter.dark.svg' };

	documentationUrl = 'https://app.docrouter.ai';

	properties: INodeProperties[] = [
		{
			displayName: 'Organization API Token',
			name: 'apiToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description: 'Your DocRouter organization-level API token.',
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
			url: '/v0/account/token/organization',
			method: 'GET',
			qs: {
				token: '={{$credentials?.apiToken}}',
			},
		},
	};
}
