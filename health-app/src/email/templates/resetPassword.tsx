import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface ResetPasswordEmailProps {
  resetPasswordUrl: string;
  userName?: string;
}

export const ResetPasswordEmailTemplate = ({
  resetPasswordUrl,
  userName = 'Usuario',
}: ResetPasswordEmailProps): React.JSX.Element => {
  return (
    <Html>
      <Head />
      <Preview>
        Recupera tu contraseña - Tu bienestar es nuestra prioridad
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header con gradiente */}
          <Section style={header}>
            <div style={logoContainer}></div>
          </Section>

          {/* Contenido principal */}
          <Section style={content}>
            <Heading style={h1}>Recupera tu contraseña</Heading>

            <Text style={text}>
              Hola <strong>{userName}</strong>,
            </Text>

            <Text style={text}>
              Recibimos una solicitud para restablecer la contraseña de tu
              cuenta. Si fuiste tú, haz clic en el botón de abajo para crear una
              nueva contraseña.
            </Text>

            {/* Botón principal */}
            <Section style={buttonContainer}>
              <Button style={button} href={resetPasswordUrl}>
                Restablecer contraseña
              </Button>
            </Section>

            <Text style={textSmall}>
              Este enlace expirará en <strong>10 minutos</strong> por tu
              seguridad.
            </Text>

            {/* Divider */}
            <div style={divider}></div>

            <Text style={textSmall}>
              Si no solicitaste restablecer tu contraseña, puedes ignorar este
              correo de forma segura. Tu contraseña actual seguirá siendo
              válida.
            </Text>
          </Section>

          {/* Footer */}
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

export default ResetPasswordEmailTemplate;

// Estilos inline
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
  background: 'linear-gradient(135deg, #C4B5FD 0%, #A78BFA 100%)',
  padding: '40px 0',
  textAlign: 'center' as const,
};

const logoContainer = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '60px',
};

const content = {
  padding: '40px 40px 20px',
};

const h1 = {
  color: '#7C3AED',
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

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#A78BFA',
  borderRadius: '12px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 40px',
  transition: 'all 0.3s ease',
  boxShadow: '0 4px 12px rgba(167, 139, 250, 0.3)',
};

const divider = {
  borderTop: '1px solid #E5E7EB',
  margin: '32px 0',
};

const footer = {
  backgroundColor: '#FEF3F2',
  padding: '32px 40px',
  textAlign: 'center' as const,
  borderTop: '1px solid #FED7E2',
};

const footerText = {
  color: '#7C3AED',
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
