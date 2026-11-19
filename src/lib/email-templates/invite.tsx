import * as React from 'react'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from '@react-email/components'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({
  siteName,
  siteUrl,
  confirmationUrl,
}: InviteEmailProps) => (
  <Html lang="pt" dir="ltr">
    <Head>
      <style>{darkModeCss}</style>
    </Head>
    <Preview>Foste convidado para o {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>{siteName}</Text>
        <Heading style={h1}>Foste convidado</Heading>
        <Text style={text}>
          Foste convidado a juntar-te ao{' '}
          <Link href={siteUrl} style={link}>
            <strong>{siteName}</strong>
          </Link>
          . Clica no botão abaixo para aceitares o convite e criares a tua
          conta.
        </Text>
        <Button className="dm-btn" style={button} href={confirmationUrl}>
          Aceitar convite
        </Button>
        <Text style={footer}>
          Se não estavas à espera deste convite, podes ignorar este email com
          segurança.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

const main = { backgroundColor: '#F6F3EC', fontFamily: 'Arial, sans-serif' }
const container = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  padding: '32px 28px',
  margin: '24px auto',
}
const brand = {
  fontSize: '18px',
  fontWeight: 'bold' as const,
  color: '#18352B',
  margin: '0 0 24px',
}
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: '#202622',
  margin: '0 0 20px',
}
const text = {
  fontSize: '14px',
  color: '#55575d',
  lineHeight: '1.5',
  margin: '0 0 25px',
}
const link = { color: '#18352B', textDecoration: 'underline' }
const button = {
  backgroundColor: '#18352B',
  color: '#F6F3EC',
  fontSize: '14px',
  border: '1px solid #18352B',
  borderRadius: '999px',
  padding: '12px 24px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
// Rendered as a text child, which React may HTML-escape: keep this CSS free of >, &, and quotes.
const darkModeCss = `
  @media (prefers-color-scheme: dark) {
    .dm-btn { background-color: #F6F3EC !important; color: #18352B !important; }
  }
  [data-ogsc] .dm-btn { background-color: #F6F3EC !important; color: #18352B !important; }
  [data-ogsb] .dm-btn { background-color: #F6F3EC !important; color: #18352B !important; }
`
