import * as React from 'react'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from '@react-email/components'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
}: RecoveryEmailProps) => (
  <Html lang="pt" dir="ltr">
    <Head>
      <style>{darkModeCss}</style>
    </Head>
    <Preview>Recupera a tua password no {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>{siteName}</Text>
        <Heading style={h1}>Recuperar password</Heading>
        <Text style={text}>
          Recebemos um pedido para redefinir a tua password no {siteName}.
          Clica no botão abaixo para escolheres uma nova password.
        </Text>
        <Button className="dm-btn" style={button} href={confirmationUrl}>
          Redefinir password
        </Button>
        <Text style={footer}>
          Se não pediste a recuperação da password, podes ignorar este email
          com segurança. A tua password não será alterada.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

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
