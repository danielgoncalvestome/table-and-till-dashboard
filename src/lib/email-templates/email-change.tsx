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

interface EmailChangeEmailProps {
  siteName: string
  // oldEmail is the user's current address (HookData.OldEmail). For the
  // NEW-recipient half of a secure email_change fanout, `email` equals the
  // recipient (NEW), so the "from" line must render oldEmail to read
  // "from OLD to NEW" instead of "from NEW to NEW".
  oldEmail: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  oldEmail,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="pt" dir="ltr">
    <Head>
      <style>{darkModeCss}</style>
    </Head>
    <Preview>Confirma a alteração de email no {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>{siteName}</Text>
        <Heading style={h1}>Confirma a alteração de email</Heading>
        <Text style={text}>
          Pediste para alterar o teu endereço de email no {siteName} de{' '}
          <Link href={`mailto:${oldEmail}`} style={link}>
            {oldEmail}
          </Link>{' '}
          para{' '}
          <Link href={`mailto:${newEmail}`} style={link}>
            {newEmail}
          </Link>
          .
        </Text>
        <Text style={text}>
          Clica no botão abaixo para confirmares esta alteração:
        </Text>
        <Button className="dm-btn" style={button} href={confirmationUrl}>
          Confirmar alteração
        </Button>
        <Text style={footer}>
          Se não pediste esta alteração, protege a tua conta de imediato.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

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
