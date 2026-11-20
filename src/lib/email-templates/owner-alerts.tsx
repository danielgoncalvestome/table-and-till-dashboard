import * as React from 'react'
import { Body, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

const OWNER = 'danielgoncalvestome@gmail.com'
const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', color: '#202622' }
const container = { padding: '28px 24px', maxWidth: '560px' }
const brand = { color: '#18352B', fontSize: '22px', fontWeight: 700, margin: '0 0 18px' }
const h = { color: '#18352B', fontSize: '20px', margin: '0 0 14px' }
const box = { backgroundColor: '#F6F3EC', borderRadius: '10px', padding: '14px 16px' }
const row = { margin: '4px 0', fontSize: '14px', lineHeight: '20px' }

const Shell = ({ preview, title, children }: { preview: string; title: string; children: React.ReactNode }) => (
  <Html lang="pt" dir="ltr"><Head /><Preview>{preview}</Preview>
    <Body style={main}><Container style={container}>
      <Text style={brand}>Crumb.</Text><Heading style={h}>{title}</Heading>
      <Section style={box}>{children}</Section>
    </Container></Body></Html>
)

const Contact = ({ name = '—', email = '—', message = '' }: { name?: string; email?: string; message?: string }) => (
  <Shell preview={`Nova mensagem de ${name}`} title="Nova mensagem de contacto">
    <Text style={row}><b>Nome:</b> {name}</Text>
    <Text style={row}><b>Email:</b> {email}</Text>
    <Text style={{ ...row, whiteSpace: 'pre-wrap' }}>{message}</Text>
  </Shell>
)

const Sub = ({ plan = '—', email = '—', status = '—', environment = 'live' }: { plan?: string; email?: string; status?: string; environment?: string }) => (
  <Shell preview={`Nova subscrição: ${plan}`} title="Nova subscrição">
    <Text style={row}><b>Plano:</b> {plan}</Text>
    <Text style={row}><b>Conta:</b> {email}</Text>
    <Text style={row}><b>Estado:</b> {status}</Text>
    {environment !== 'live' && <Text style={row}><b>Modo de teste</b></Text>}
  </Shell>
)

export const contactAlert = {
  component: Contact, to: OWNER, displayName: 'Aviso: mensagem de contacto',
  subject: (d: Record<string, any>) => `Nova mensagem de contacto — ${d.name ?? ''}`,
  previewData: { name: 'Ana Silva', email: 'ana@exemplo.pt', message: 'Olá, gostava de saber mais.' },
} satisfies TemplateEntry

export const subscriptionAlert = {
  component: Sub, to: OWNER, displayName: 'Aviso: nova subscrição',
  subject: (d: Record<string, any>) => `Nova subscrição — ${d.plan ?? ''}`,
  previewData: { plan: 'Gestão e Reservas', email: 'restaurante@exemplo.pt', status: 'active', environment: 'live' },
} satisfies TemplateEntry
