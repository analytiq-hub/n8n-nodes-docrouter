import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

export class DocRouterPrompt implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'DocRouter Prompt',
		name: 'docRouterPrompt',
		icon: { light: 'file:../../icons/docrouter.svg', dark: 'file:../../icons/docrouter.dark.svg' },
		group: ['input'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Manage prompts in DocRouter.ai',
		defaults: {
			name: 'DocRouter Prompt',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'docRouterOrgApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'List',
						value: 'list',
						description: 'List prompts in the organization',
						action: 'List prompts',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get a prompt by revision ID',
						action: 'Get a prompt',
					},
					{
						name: 'Create',
						value: 'create',
						description: 'Create a prompt',
						action: 'Create a prompt',
					},
					{
						name: 'Update',
						value: 'update',
						description: 'Update a prompt',
						action: 'Update a prompt',
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete a prompt',
						action: 'Delete a prompt',
					},
					{
						name: 'List Versions',
						value: 'listVersions',
						description: 'List all versions of a prompt',
						action: 'List prompt versions',
					},
				],
				default: 'list',
			},
			// ===== List parameters =====
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				typeOptions: { min: 1, max: 100 },
				default: 10,
				displayOptions: { show: { operation: ['list'] } },
				description: 'Maximum number of prompts to return',
			},
			{
				displayName: 'Skip',
				name: 'skip',
				type: 'number',
				typeOptions: { min: 0 },
				default: 0,
				displayOptions: { show: { operation: ['list'] } },
				description: 'Number of prompts to skip (pagination)',
			},
			{
				displayName: 'Document ID',
				name: 'documentId',
				type: 'string',
				default: '',
				displayOptions: { show: { operation: ['list'] } },
				description: 'Filter prompts by document tags',
			},
			{
				displayName: 'Tag IDs',
				name: 'tagIds',
				type: 'string',
				default: '',
				displayOptions: { show: { operation: ['list'] } },
				description: 'Comma-separated tag IDs to filter by',
			},
			{
				displayName: 'Name Search',
				name: 'nameSearch',
				type: 'string',
				default: '',
				displayOptions: { show: { operation: ['list'] } },
				description: 'Search term for prompt names',
			},
			// ===== Get: prompt revision ID =====
			{
				displayName: 'Prompt Revision ID',
				name: 'promptRevid',
				type: 'string',
				default: '',
				required: true,
				displayOptions: { show: { operation: ['get'] } },
				description: 'The prompt revision ID',
			},
			// ===== Update / Delete / List Versions: prompt ID =====
			{
				displayName: 'Prompt ID',
				name: 'promptId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: { show: { operation: ['update', 'delete', 'listVersions'] } },
				description: 'The prompt ID (stable id, not revision)',
			},
			// ===== Create / Update: prompt config =====
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				required: true,
				displayOptions: { show: { operation: ['create', 'update'] } },
				description: 'Prompt name',
			},
			{
				displayName: 'Content',
				name: 'content',
				type: 'string',
				typeOptions: { rows: 4 },
				default: '',
				required: true,
				displayOptions: { show: { operation: ['create', 'update'] } },
				description: 'Prompt content (template text)',
			},
			{
				displayName: 'Schema ID',
				name: 'schemaId',
				type: 'string',
				default: '',
				displayOptions: { show: { operation: ['create', 'update'] } },
				description: 'Optional schema ID for structured output',
			},
			{
				displayName: 'Schema Version',
				name: 'schemaVersion',
				type: 'number',
				default: undefined,
				displayOptions: { show: { operation: ['create', 'update'] } },
				description: 'Optional schema version',
			},
			{
				displayName: 'Tag IDs',
				name: 'tagIdsBody',
				type: 'string',
				default: '',
				displayOptions: { show: { operation: ['create', 'update'] } },
				description: 'Comma-separated tag IDs to associate with the prompt',
			},
			{
				displayName: 'Model',
				name: 'model',
				type: 'string',
				default: 'gpt-4o-mini',
				displayOptions: { show: { operation: ['create', 'update'] } },
				description: 'LLM model to use for this prompt',
			},
			{
				displayName: 'Knowledge Base ID',
				name: 'kbId',
				type: 'string',
				default: '',
				displayOptions: { show: { operation: ['create', 'update'] } },
				description: 'Optional knowledge base ID',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const operation = this.getNodeParameter('operation', 0) as string;

		const credentials = await this.getCredentials('docRouterOrgApi');
		const baseUrl =
			(credentials?.baseUrl as string)?.trim() || 'https://app.docrouter.ai/fastapi';
		const apiToken = credentials?.apiToken as string;

		const tokenInfoResponse = (await this.helpers.httpRequestWithAuthentication.call(
			this,
			'docRouterOrgApi',
			{
				method: 'GET',
				baseURL: baseUrl,
				url: '/v0/account/token/organization',
				qs: { token: apiToken },
				json: true,
			},
		)) as IDataObject;

		const organizationId = tokenInfoResponse?.organization_id as string;
		if (!organizationId) {
			throw new NodeOperationError(
				this.getNode(),
				'Could not determine organization ID from token. Use an organization-level API token.',
			);
		}

		if (operation === 'list') {
			try {
				const limit = this.getNodeParameter('limit', 0, 10) as number;
				const skip = this.getNodeParameter('skip', 0, 0) as number;
				const documentId = this.getNodeParameter('documentId', 0, '') as string;
				const tagIds = this.getNodeParameter('tagIds', 0, '') as string;
				const nameSearch = this.getNodeParameter('nameSearch', 0, '') as string;

				const qs: IDataObject = { limit, skip };
				if (documentId?.trim()) qs.document_id = documentId.trim();
				if (tagIds?.trim()) qs.tag_ids = tagIds.trim();
				if (nameSearch?.trim()) qs.name_search = nameSearch.trim();

				const response = await this.helpers.httpRequestWithAuthentication.call(
					this,
					'docRouterOrgApi',
					{
						method: 'GET',
						baseURL: baseUrl,
						url: `/v0/orgs/${organizationId}/prompts`,
						qs,
						json: true,
					},
				);

				returnData.push({
					json: (response ?? {}) as IDataObject,
					pairedItem: { item: 0 },
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message } as IDataObject,
						pairedItem: { item: 0 },
						error:
							error instanceof NodeOperationError
								? error
								: new NodeOperationError(this.getNode(), error as Error),
					});
				} else {
					throw error;
				}
			}
			return [returnData];
		}

		if (operation === 'listVersions') {
			try {
				const promptId = this.getNodeParameter('promptId', 0) as string;
				const response = await this.helpers.httpRequestWithAuthentication.call(
					this,
					'docRouterOrgApi',
					{
						method: 'GET',
						baseURL: baseUrl,
						url: `/v0/orgs/${organizationId}/prompts/${promptId}/versions`,
						json: true,
					},
				);
				returnData.push({
					json: (response ?? {}) as IDataObject,
					pairedItem: { item: 0 },
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message } as IDataObject,
						pairedItem: { item: 0 },
						error:
							error instanceof NodeOperationError
								? error
								: new NodeOperationError(this.getNode(), error as Error),
					});
				} else {
					throw error;
				}
			}
			return [returnData];
		}

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				let response: IDataObject;

				switch (operation) {
					case 'get': {
						const promptRevid = this.getNodeParameter('promptRevid', itemIndex) as string;
						response = (await this.helpers.httpRequestWithAuthentication.call(
							this,
							'docRouterOrgApi',
							{
								method: 'GET',
								baseURL: baseUrl,
								url: `/v0/orgs/${organizationId}/prompts/${promptRevid}`,
								json: true,
							},
						)) as IDataObject;
						break;
					}

					case 'create': {
						const name = this.getNodeParameter('name', itemIndex) as string;
						const content = this.getNodeParameter('content', itemIndex) as string;
						const schemaId = this.getNodeParameter('schemaId', itemIndex, '') as string;
						const schemaVersion = this.getNodeParameter(
							'schemaVersion',
							itemIndex,
							undefined,
						) as number | undefined;
						const tagIdsBody = this.getNodeParameter('tagIdsBody', itemIndex, '') as string;
						const model = this.getNodeParameter('model', itemIndex, 'gpt-4o-mini') as string;
						const kbId = this.getNodeParameter('kbId', itemIndex, '') as string;

						const body: IDataObject = {
							name: name.trim(),
							content: content.trim(),
							model: model?.trim() || 'gpt-4o-mini',
						};
						if (schemaId?.trim()) body.schema_id = schemaId.trim();
						if (schemaVersion != null) body.schema_version = schemaVersion;
						if (tagIdsBody?.trim()) {
							body.tag_ids = tagIdsBody
								.split(',')
								.map((id) => id.trim())
								.filter(Boolean);
						}
						if (kbId?.trim()) body.kb_id = kbId.trim();

						response = (await this.helpers.httpRequestWithAuthentication.call(
							this,
							'docRouterOrgApi',
							{
								method: 'POST',
								baseURL: baseUrl,
								url: `/v0/orgs/${organizationId}/prompts`,
								body,
								json: true,
							},
						)) as IDataObject;
						break;
					}

					case 'update': {
						const promptId = this.getNodeParameter('promptId', itemIndex) as string;
						const name = this.getNodeParameter('name', itemIndex) as string;
						const content = this.getNodeParameter('content', itemIndex) as string;
						const schemaId = this.getNodeParameter('schemaId', itemIndex, '') as string;
						const schemaVersion = this.getNodeParameter(
							'schemaVersion',
							itemIndex,
							undefined,
						) as number | undefined;
						const tagIdsBody = this.getNodeParameter('tagIdsBody', itemIndex, '') as string;
						const model = this.getNodeParameter('model', itemIndex, 'gpt-4o-mini') as string;
						const kbId = this.getNodeParameter('kbId', itemIndex, '') as string;

						const body: IDataObject = {
							name: name.trim(),
							content: content.trim(),
							model: model?.trim() || 'gpt-4o-mini',
						};
						if (schemaId?.trim()) body.schema_id = schemaId.trim();
						if (schemaVersion != null) body.schema_version = schemaVersion;
						if (tagIdsBody?.trim()) {
							body.tag_ids = tagIdsBody
								.split(',')
								.map((id) => id.trim())
								.filter(Boolean);
						}
						if (kbId?.trim()) body.kb_id = kbId.trim();

						response = (await this.helpers.httpRequestWithAuthentication.call(
							this,
							'docRouterOrgApi',
							{
								method: 'PUT',
								baseURL: baseUrl,
								url: `/v0/orgs/${organizationId}/prompts/${promptId}`,
								body,
								json: true,
							},
						)) as IDataObject;
						break;
					}

					case 'delete': {
						const promptId = this.getNodeParameter('promptId', itemIndex) as string;
						await this.helpers.httpRequestWithAuthentication.call(this, 'docRouterOrgApi', {
							method: 'DELETE',
							baseURL: baseUrl,
							url: `/v0/orgs/${organizationId}/prompts/${promptId}`,
							json: true,
						});
						response = { success: true, promptId };
						break;
					}

					default:
						if (operation === '__CUSTOM_API_CALL__') {
							throw new NodeOperationError(
								this.getNode(),
								'For custom API calls, use the HTTP Request node and choose "DocRouter Organization API" under Authentication → Predefined Credential Type. This node only supports List, Get, Create, Update, Delete, and List Versions.',
							);
						}
						throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
				}

				returnData.push({
					json: (response ?? {}) as IDataObject,
					pairedItem: { item: itemIndex },
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message } as IDataObject,
						pairedItem: { item: itemIndex },
						error:
							error instanceof NodeOperationError
								? error
								: new NodeOperationError(this.getNode(), error as Error),
					});
				} else {
					if (error instanceof Error && 'context' in error) {
						(error as NodeOperationError).context = {
							...(error as NodeOperationError).context,
							itemIndex,
						};
					}
					throw error;
				}
			}
		}

		return [returnData];
	}
}
