const META_API_BASE = 'https://graph.facebook.com/v21.0';

export interface TemplateParameter {
  type: 'text';
  text: string;
}

export interface TemplateComponent {
  type: 'body';
  parameters: TemplateParameter[];
}

export interface MetaApiResponse {
  messaging_product: string;
  contacts: Array<{ input: string; wa_id: string }>;
  messages: Array<{ id: string }>;
}

export class WhatsAppApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public metaError?: unknown,
  ) {
    super(message);
    this.name = 'WhatsAppApiError';
  }
}

export class WhatsAppClient {
  constructor(
    private phoneNumberId: string,
    private accessToken: string,
  ) {}

  async sendTemplate(
    to: string,
    templateName: string,
    languageCode: string,
    components: TemplateComponent[],
  ): Promise<MetaApiResponse> {
    const url = `${META_API_BASE}/${this.phoneNumberId}/messages`;

    const body = {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
        components,
      },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new WhatsAppApiError(
        data?.error?.message || 'WhatsApp API error',
        res.status,
        data?.error,
      );
    }

    return data as MetaApiResponse;
  }

  static formatPhoneNumber(phone: string, defaultCountryCode: string = '+91'): string {
    // Strip all non-digit characters
    let digits = phone.replace(/\D/g, '');

    // Remove leading 0
    if (digits.startsWith('0')) {
      digits = digits.slice(1);
    }

    // Extract country code digits (without +)
    const countryDigits = defaultCountryCode.replace(/\D/g, '');

    // If number already starts with country code, return as-is
    if (digits.startsWith(countryDigits)) {
      return digits;
    }

    // Prepend country code
    return countryDigits + digits;
  }
}
