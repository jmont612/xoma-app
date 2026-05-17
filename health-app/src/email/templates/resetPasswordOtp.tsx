import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface ResetPasswordOtpEmailProps {
  verificationCode: string;
  userName?: string;
}

export const ResetPasswordOtpEmailTemplate = ({
  verificationCode,
  userName = 'Usuario',
}: ResetPasswordOtpEmailProps): React.JSX.Element => {
  return (
    <Html>
      <Head />
      <Preview>Tu código de verificación para restablecer contraseña</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <div style={logoContainer}></div>
          </Section>

          <Section style={content}>
            <Heading style={h1}>Código de verificación</Heading>

            <Text style={text}>
              Hola <strong>{userName}</strong>,
            </Text>

            <Text style={text}>
              Recibimos una solicitud para restablecer la contraseña de tu
              cuenta. Ingresa el siguiente código en la aplicación:
            </Text>

            <Section style={codeContainer}>
              <Text style={code}>{verificationCode}</Text>
            </Section>

            <Text style={textSmall}>
              Este código expirará en <strong>10 minutos</strong> por tu
              seguridad.
            </Text>

            <div style={divider}></div>

            <Text style={textSmall}>
              Si no solicitaste restablecer tu contraseña, puedes ignorar este
              correo. Tu contraseña actual seguirá siendo válida.
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              Estamos aquí para apoyarte en tu bienestar emocional
            </Text>
            <Text style={footerTextSmall}>
              Este es un correo automático, por favor no respondas a este
              mensaje.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default ResetPasswordOtpEmailTemplate;

const main = {
  backgroundColor: '#f5f5f5',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  padding: '40px 0',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  maxWidth: '600px',
  borderRadius: '24px',
  overflow: 'hidden',
  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
};

const header = {
  background: 'linear-gradient(135deg, #8FB9A8 0%, #2D5A6E 100%)',
  padding: '40px 0',
  textAlign: 'center' as const,
};

const logoContainer = {
  minHeight: '60px',
};

const content = {
  padding: '40px 40px 20px',
};

const h1 = {
  color: '#2D5A6E',
  fontSize: '28px',
  fontWeight: '700',
  lineHeight: '1.3',
  margin: '0 0 24px',
  textAlign: 'center' as const,
};

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 16px',
};

const textSmall = {
  color: '#6B7280',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0 0 12px',
};

const codeContainer = {
  backgroundColor: '#EAF5F5',
  borderRadius: '16px',
  padding: '24px',
  margin: '24px 0',
  textAlign: 'center' as const,
};

const code = {
  color: '#2D5A6E',
  fontSize: '42px',
  fontWeight: '800',
  letterSpacing: '12px',
  margin: '0',
};

const divider = {
  borderTop: '1px solid #E5E7EB',
  margin: '32px 0',
};

const footer = {
  backgroundColor: '#F8FAF9',
  padding: '32px 40px',
  textAlign: 'center' as const,
  borderTop: '1px solid #E5E7EB',
};

const footerText = {
  color: '#2D5A6E',
  fontSize: '15px',
  lineHeight: '1.5',
  margin: '0 0 8px',
  fontWeight: '500',
};

const footerTextSmall = {
  color: '#9CA3AF',
  fontSize: '13px',
  lineHeight: '1.4',
  margin: '0',
};
