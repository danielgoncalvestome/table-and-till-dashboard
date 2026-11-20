import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

export const submitContact = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    name: z.string().trim().min(1).max(120),
    email: z.string().trim().email().max(255),
    message: z.string().trim().min(1).max(5000),
  }))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data: row, error } = await supabaseAdmin.from('contact_submissions').insert(data).select('id').single();
    if (error) { console.error('contact insert failed', error.message); return { ok: false }; }
    try {
      const { sendTemplateEmail } = await import('@/lib/email-templates/send-email');
      await sendTemplateEmail('owner-contact-alert', 'danielgoncalvestome@gmail.com', { templateData: data, idempotencyKey: `owner-contact-${row.id}`, replyTo: data.email });
    } catch (e) { console.error('contact alert failed', e instanceof Error ? e.message : e); }
    return { ok: true };
  });
