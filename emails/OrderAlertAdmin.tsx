import { Html, Head, Body, Container, Heading, Text, Section, Row, Column } from '@react-email/components'

interface OrderAlertAdminProps {
  orderId: number
  customerName: string
  phone: string
  email: string | null
  address: string
  items: { partName: string; price: number; quantity: number }[]
  totalAmount: number
}

export default function OrderAlertAdmin({ orderId, customerName, phone, email, address, items, totalAmount }: OrderAlertAdminProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'Arial, sans-serif', color: '#333' }}>
        <Container style={{ maxWidth: 600, margin: '0 auto', padding: 20 }}>
          <Heading style={{ color: '#E60012' }}>New Paid Order Received</Heading>
          <Text>Order #{orderId}</Text>
          <Text>Customer: {customerName}</Text>
          <Text>Phone: {phone}</Text>
          {email && <Text>Email: {email}</Text>}
          <Text>Address: {address}</Text>
          <Section>
            {items.map((item, i) => (
              <Row key={i}>
                <Column>{item.partName}</Column>
                <Column>x{item.quantity}</Column>
                <Column>Rs {(item.price * item.quantity).toLocaleString()}</Column>
              </Row>
            ))}
          </Section>
          <Text style={{ fontWeight: 'bold', fontSize: 16 }}>Total: Rs {totalAmount.toLocaleString()}</Text>
        </Container>
      </Body>
    </Html>
  )
}
