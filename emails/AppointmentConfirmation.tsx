import { Html, Head, Body, Container, Heading, Text, Section, Row, Column } from '@react-email/components'

interface AppointmentConfirmationProps {
  appointmentId: number
  customerName: string
  bikeModel: string
  services: string[]
  appointmentDate: string
  appointmentTime: string
  description?: string
}

export default function AppointmentConfirmation({
  appointmentId,
  customerName,
  bikeModel,
  services,
  appointmentDate,
  appointmentTime,
  description,
}: AppointmentConfirmationProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'Arial, sans-serif', color: '#333' }}>
        <Container style={{ maxWidth: 600, margin: '0 auto', padding: 20 }}>
          <Heading style={{ color: '#E60012' }}>Suzuki Motorcycle Nepal</Heading>
          <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Service Appointment Confirmation</Text>
          <Text>Dear {customerName},</Text>
          <Text>Your service appointment has been successfully booked!</Text>

          <Section style={{ marginTop: 20, padding: 15, backgroundColor: '#f5f5f5' }}>
            <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>Appointment Details</Text>
            <Row style={{ marginBottom: 8 }}>
              <Column style={{ width: '40%' }}>
                <Text style={{ fontWeight: 'bold', margin: 0 }}>Appointment ID:</Text>
              </Column>
              <Column>
                <Text style={{ margin: 0 }}>#APP{appointmentId}</Text>
              </Column>
            </Row>
            <Row style={{ marginBottom: 8 }}>
              <Column style={{ width: '40%' }}>
                <Text style={{ fontWeight: 'bold', margin: 0 }}>Bike Model:</Text>
              </Column>
              <Column>
                <Text style={{ margin: 0 }}>{bikeModel}</Text>
              </Column>
            </Row>
            <Row style={{ marginBottom: 8 }}>
              <Column style={{ width: '40%' }}>
                <Text style={{ fontWeight: 'bold', margin: 0 }}>Date:</Text>
              </Column>
              <Column>
                <Text style={{ margin: 0 }}>{appointmentDate}</Text>
              </Column>
            </Row>
            <Row style={{ marginBottom: 8 }}>
              <Column style={{ width: '40%' }}>
                <Text style={{ fontWeight: 'bold', margin: 0 }}>Time:</Text>
              </Column>
              <Column>
                <Text style={{ margin: 0 }}>{appointmentTime}</Text>
              </Column>
            </Row>
            <Row>
              <Column style={{ width: '40%' }}>
                <Text style={{ fontWeight: 'bold', margin: 0 }}>Services:</Text>
              </Column>
              <Column>
                <Text style={{ margin: 0 }}>{services.join(', ')}</Text>
              </Column>
            </Row>
          </Section>

          {description && (
            <Section style={{ marginTop: 20 }}>
              <Text style={{ fontWeight: 'bold' }}>Issue Description:</Text>
              <Text style={{ padding: 10, backgroundColor: '#f9f9f9', borderLeft: '3px solid #E60012' }}>{description}</Text>
            </Section>
          )}

          <Section style={{ marginTop: 20 }}>
            <Text style={{ color: '#666' }}>
              Your appointment is <strong>confirmed</strong>! We have scheduled your service and will see you on the specified date and time.
            </Text>
            <Text style={{ color: '#666' }}>If you need to reschedule or cancel, please log in to your account and manage your appointments.</Text>
          </Section>

          <Section style={{ marginTop: 30, borderTop: '1px solid #ddd', paddingTop: 20 }}>
            <Text style={{ color: '#999', fontSize: 12 }}>Suzuki Motorcycle Nepal | Service Support</Text>
            <Text style={{ color: '#999', fontSize: 12 }}>Phone: +977-1-XXXXXX</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
