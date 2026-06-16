import * as React from "react"
import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components"
import { emailAsset, EMAIL_HEADER_IMAGE_PATH } from "@/lib/email/config"
import { EmailSocialIcons } from "@/emails/email-social-icons"

export type ManagerAttendanceReportEmailProps = {
  /** Ej: "del 1 al 15 de junio de 2026" */
  periodo: string
  /** Bloque HTML opcional: métricas, tabla comparativa, etc. */
  bodyHtml?: string
  previewText?: string
}

const styles = {
  body: {
    backgroundColor: "#ffffff",
    fontFamily: "Arial, Helvetica, sans-serif",
    margin: 0,
    padding: 0,
  },
  container: {
    maxWidth: "640px",
    margin: "0 auto",
    padding: "16px 24px 32px",
  },
  headerImg: {
    display: "block",
    width: "100%",
    maxWidth: "600px",
    height: "auto",
    margin: "0 auto 12px",
  },
  dividerImg: {
    display: "block",
    width: "100%",
    maxWidth: "600px",
    height: "auto",
    margin: "16px 0",
  },
  paragraph: {
    color: "#333333",
    fontSize: "14px",
    lineHeight: "22px",
    margin: "0 0 12px",
    textAlign: "justify" as const,
  },
  footerSmall: {
    color: "#555555",
    fontSize: "11px",
    lineHeight: "16px",
    margin: "0 0 4px",
  },
  footerBold: {
    color: "#333333",
    fontSize: "12px",
    lineHeight: "18px",
    fontWeight: "bold" as const,
    margin: "0 0 4px",
  },
  legal: {
    color: "#666666",
    fontSize: "10px",
    lineHeight: "14px",
    textAlign: "justify" as const,
    margin: "16px 0 0",
  },
}

const ASSETS = {
  /** Reemplazar por linea-roja.jpg cuando esté en public/email */
  lineaRoja: "/email/linea-roja.svg",
  linea: "/email/linea.svg",
}

export function ManagerAttendanceReportEmail({
  periodo,
  bodyHtml,
  previewText = "Reporte de asistencias — Área de Cultura",
}: ManagerAttendanceReportEmailProps) {
  return (
    <Html lang="es">
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Img
            src={emailAsset(EMAIL_HEADER_IMAGE_PATH)}
            alt="Vicerrectoría de Bienestar Universitario — Área de Cultura — Universidad del Valle"
            width={600}
            style={styles.headerImg}
          />

          <Img
            src={emailAsset(ASSETS.lineaRoja)}
            alt=""
            width={600}
            height={4}
            style={styles.dividerImg}
          />

          <Section>
            <Text style={styles.paragraph}>
              Estimado(a) monitor(a), director(a) o entrenador(a):
            </Text>
            <Text style={styles.paragraph}>
              En el marco del seguimiento y control de la participación en los grupos culturales y
              deportivos, remitimos el reporte de asistencias correspondiente al período{" "}
              <strong>{periodo}</strong>.
            </Text>
            <Text style={styles.paragraph}>
              El presente informe contiene el consolidado de asistencia de los integrantes de su
              grupo, permitiendo identificar los niveles de participación y realizar el respectivo
              seguimiento durante el período reportado.
            </Text>
            <Text style={styles.paragraph}>A continuación, encontrará el detalle de la información.</Text>

            {bodyHtml ? (
              <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
            ) : null}
          </Section>

          <Img
            src={emailAsset(ASSETS.lineaRoja)}
            alt=""
            width={600}
            height={4}
            style={styles.dividerImg}
          />

          <EmailSocialIcons />

          <Img
            src={emailAsset(ASSETS.lineaRoja)}
            alt=""
            width={600}
            height={4}
            style={styles.dividerImg}
          />
          <Img
            src={emailAsset(ASSETS.linea)}
            alt=""
            width={600}
            height={2}
            style={styles.dividerImg}
          />

          <Section>
            <Text style={styles.footerBold}>Área de Cultura</Text>
            <Text style={styles.footerSmall}>Sección Cultura, Recreación y Deporte</Text>
            <Text style={styles.footerSmall}>Vicerrectoría de Bienestar Universitario</Text>
            <Text style={styles.footerSmall}>Universidad del Valle</Text>
            <Text style={styles.footerSmall}>
              Calle 13 # 100-00, Cali, Valle del Cauca, Colombia
            </Text>
            <Text style={styles.footerSmall}>Edificio D17 - Oficina de Cultura</Text>
            <Text style={styles.footerSmall}>Tel: 3212100 Ext 3292</Text>
            <Text style={styles.footerSmall}>Cali - Colombia</Text>
            <Text style={{ ...styles.footerSmall, marginTop: "12px" }}>
              Institución de Educación Superior sujeta a inspección y vigilancia por el Ministerio
              de Educación Nacional
            </Text>
          </Section>

          <Img
            src={emailAsset(ASSETS.linea)}
            alt=""
            width={600}
            height={2}
            style={styles.dividerImg}
          />

          <Hr style={{ borderColor: "#cccccc", margin: "16px 0" }} />

          <Section>
            <Text style={styles.footerBold}>Área de Cultura</Text>
            <Text style={styles.footerSmall}>
              Francisco Emerson Castañeda Ramírez - Profesional
            </Text>
            <Text style={styles.footerSmall}>Sección Cultura, Recreación y Deporte</Text>
            <Text style={styles.footerSmall}>
              Calle 13 # 100-00, Cali, Valle del Cauca, Colombia
            </Text>
            <Text style={styles.footerSmall}>Edificio D17 - Oficina de Cultura</Text>
            <Text style={styles.footerSmall}>Vicerrectoría de Bienestar Universitario</Text>
            <Text style={styles.footerSmall}>Teléfonos fijos: Tel: 3212100 Ext 3292</Text>
          </Section>

          <Img
            src={emailAsset(ASSETS.lineaRoja)}
            alt=""
            width={600}
            height={4}
            style={{ ...styles.dividerImg, marginTop: "24px" }}
          />

          <Text style={styles.legal}>
            <strong>AVISO LEGAL:</strong> Este mensaje y/o sus anexos son confidenciales y para uso
            exclusivo de su destinatario intencional. Si usted no es el destinatario, le informamos
            que no podrá usar, retener, imprimir, copiar, distribuir o hacer público su contenido.
            Cualquier retención, revisión no autorizada, distribución, divulgación, reenvío, copia,
            impresión, reproducción o uso indebido de este mensaje y/o anexos, está estrictamente
            prohibida y sancionada de acuerdo con la Ley 1273 de enero del 2009. Si ha recibido este
            correo por error, por favor elimínelo e infórmenos al correo{" "}
            <Link href="mailto:areacultura.cdr@correounivalle.edu.co">
              areacultura.cdr@correounivalle.edu.co
            </Link>
            . Si usted es el destinatario, le solicitamos mantener reserva sobre el contenido, los
            datos o información de contacto del remitente y en general sobre la información de este
            documento y/o archivos adjuntos, a no ser que exista una autorización explícita.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default ManagerAttendanceReportEmail
