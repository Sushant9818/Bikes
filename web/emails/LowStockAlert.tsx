import { Html, Head, Body, Container, Heading, Text, Section } from '@react-email/components'

interface LowStockAlertProps {
  partName: string
  compatibleModel: string | null
  quantity: number
}

export default function LowStockAlert({ partName, compatibleModel, quantity }: LowStockAlertProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'Arial, sans-serif', color: '#333' }}>
        <Container style={{ maxWidth: 600, margin: '0 auto', padding: 20 }}>
          <Heading style={{ color: '#E60012' }}>Low Stock Alert</Heading>
          <Section style={{ background: '#fff3cd', padding: 15, borderRadius: 5 }}>
            <Text><strong>Part:</strong> {partName}</Text>
            <Text><strong>Compatible Model:</strong> {compatibleModel ?? 'N/A'}</Text>
            <Text><strong>Current Quantity:</strong> {quantity}</Text>
            <Text>Please restock this part as soon as possible.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
