import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { db } from '../../config/database.config.js';
import { settings } from '../../db/schema/index.js';
import { eq } from 'drizzle-orm';

interface EmailConfig {
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_password: string;
  from_email: string;
  from_name: string;
  daily_limit: number;
  enabled: boolean;
}

export class EmailClient {
  private transporter: Transporter | null = null;

  async getConfig(): Promise<EmailConfig> {
    const rows = await db
      .select()
      .from(settings)
      .where(eq(settings.category, 'email'));

    const config: Record<string, unknown> = {};
    for (const row of rows) {
      config[row.key] = row.value;
    }

    return {
      smtp_host: (config.smtp_host as string) || 'smtp.gmail.com',
      smtp_port: (config.smtp_port as number) || 587,
      smtp_user: (config.smtp_user as string) || '',
      smtp_password: (config.smtp_password as string) || '',
      from_email: (config.from_email as string) || '',
      from_name: (config.from_name as string) || 'Spirulina ERP',
      daily_limit: (config.daily_limit as number) || 20,
      enabled: config.enabled !== false,
    };
  }

  private async createTransporter(): Promise<Transporter> {
    const config = await this.getConfig();

    this.transporter = nodemailer.createTransport({
      host: config.smtp_host,
      port: config.smtp_port,
      secure: config.smtp_port === 465,
      auth: {
        user: config.smtp_user,
        pass: config.smtp_password,
      },
    });

    return this.transporter;
  }

  async sendEmail(to: string, subject: string, html: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const config = await this.getConfig();
      if (!config.enabled) {
        return { success: false, error: 'Email service is disabled' };
      }
      if (!config.smtp_user || !config.smtp_password) {
        return { success: false, error: 'SMTP credentials not configured' };
      }

      const transporter = await this.createTransporter();
      const info = await transporter.sendMail({
        from: `"${config.from_name}" <${config.from_email || config.smtp_user}>`,
        to,
        subject,
        html,
      });

      return { success: true, messageId: info.messageId };
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error };
    }
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const transporter = await this.createTransporter();
      await transporter.verify();
      return { success: true };
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : 'Connection failed';
      return { success: false, error };
    }
  }
}
