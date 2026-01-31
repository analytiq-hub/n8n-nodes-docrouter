import type {
	IDataObject,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { createHmac } from 'crypto';

export class DocRouterWebhook implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'DocRouter Webhook',
		name: 'docRouterWebhook',
		icon: { light: 'file:../../icons/docrouter.svg', dark: 'file:../../icons/docrouter.dark.svg' },
		group: ['trigger'],
		version: 1,
		description: 'Receive DocRouter webhook events (document.uploaded, llm.completed, etc.)',
		defaults: {
			name: 'DocRouter Webhook',
			color: '#1a365d',
		},
		inputs: [],
		outputs: ['main'],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: '={{$parameter["path"]}}',
			},
		],
		properties: [
			{
				displayName: 'Path',
				name: 'path',
				type: 'string',
				default: 'docrouter',
				required: true,
				placeholder: 'docrouter',
				description:
					'URL path for the webhook. Use this in DocRouter: Organization Settings → Webhooks',
			},
			{
				displayName: 'Verify Signature',
				name: 'verifySignature',
				type: 'boolean',
				default: true,
				description:
					'Verify the X-DocRouter-Signature HMAC so only DocRouter can trigger this workflow',
			},
			{
				displayName: 'Webhook Secret',
				name: 'webhookSecret',
				type: 'string',
				typeOptions: { password: true },
				default: '',
				displayOptions: {
					show: { verifySignature: [true] },
				},
				description:
					'The secret from DocRouter webhook settings. Leave empty to skip verification',
			},
		],
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const body = this.getBodyData() as IDataObject;
		const headers = this.getHeaderData() as IDataObject;
		const verifySignature = this.getNodeParameter('verifySignature', 0) as boolean;
		const rawSecret = this.getNodeParameter('webhookSecret', 0);
		const webhookSecret = typeof rawSecret === 'string' ? rawSecret.trim() : '';

		if (verifySignature && webhookSecret) {
			const signature = headers['x-docrouter-signature'] as string | undefined;
			const req = this.getRequestObject() as { rawBody?: Buffer };
			const rawBody = req.rawBody?.toString('utf8') ?? JSON.stringify(body);

			if (!signature || typeof signature !== 'string') {
				throw new NodeOperationError(
					this.getNode(),
					'Missing X-DocRouter-Signature header. Enable HMAC in DocRouter webhook settings',
				);
			}

			const timestamp = (body.timestamp as string) ?? '';
			const message = `${timestamp}.${rawBody}`;
			const expected = createHmac('sha256', webhookSecret)
				.update(message)
				.digest('hex');
			const expectedSignature = `sha256=${expected}`;

			if (signature !== expectedSignature) {
				throw new NodeOperationError(
					this.getNode(),
					'Webhook signature verification failed. Check your webhook secret',
				);
			}

			const ts = typeof timestamp === 'number' ? timestamp : parseInt(String(timestamp), 10);
			if (!Number.isNaN(ts) && Date.now() / 1000 - ts > 300) {
				throw new NodeOperationError(
					this.getNode(),
					'Webhook timestamp too old (replay?). Rejecting request',
				);
			}
		}

		const returnData: IDataObject[] = [
			{
				...body,
				webhook_meta: {
					headers: this.getHeaderData(),
					query: this.getQueryData(),
					params: this.getParamsData(),
				},
			},
		];

		return {
			workflowData: [this.helpers.returnJsonArray(returnData)],
		};
	}
}
