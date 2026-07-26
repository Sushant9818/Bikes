import { Html, Head, Body, Container, Heading, Text, Section, Row, Column } from '@react-email/components'

interface OrderConfirmationCustomerProps {
  orderId: number
  customerName: string
  phone: string
  address: string
  items: { partName: string; price: number; quantity: number }[]
  totalAmount: number
}

export default function OrderConfirmationCustomer({ orderId, customerName, phone, address, items, totalAmount }: OrderConfirmationCustomerProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'Arial, sans-serif', color: '#333' }}>
        <Container style={{ maxWidth: 600, margin: '0 auto', padding: 20 }}>
          <Heading style={{ color: '#E60012' }}>Suzuki Motorcycle Nepal</Heading>
          <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Order Confirmation</Text>
          <Text>Thank you for your order!</Text>
          <Text>Order #{orderId}</Text>
          <Text>Customer: {customerName}</Text>
          <Text>Phone: {phone}</Text>
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
          <Text>Your payment has been confirmed. We will process your order shortly.</Text>
        </Container>
      </Body>
    </Html>
  )
}
