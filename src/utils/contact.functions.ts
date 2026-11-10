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
    const { error } = await supabaseAdmin.from('contact_submissions').insert(data);
    if (error) { console.error('contact insert failed', error.message); return { ok: false }; }
    return { ok: true };
  });
