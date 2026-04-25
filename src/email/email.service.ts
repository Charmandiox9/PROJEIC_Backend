import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend;
  private readonly logger = new Logger(EmailService.name);

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async sendProjectInvitation(
    toEmail: string,
    projectName: string,
    invitationUrl: string,
    projectDescription?: string,
    projectStatus?: string,
    projectMethodology?: string,
    isInstitutional?: boolean,
    role?: string,
  ) {
    try {
      const data = await this.resend.emails.send({
        from: 'PROJEIC <notificaciones@danielduran.engineer>',
        to: [toEmail],
        subject: `Invitación para unirte a ${projectName} en PROJEIC`,

        html: `
        <!DOCTYPE html>
        <html lang="es">
        <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Invitación a PROJEIC</title>
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet"/>
        </head>
        <body style="margin:0;padding:0;background:#f5f4fb;font-family:'DM Sans',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4fb;padding:40px 0;">
            <tr><td align="center">
            <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(99,102,241,0.12);">

                <!-- Header -->
                <tr>
                <td style="background:linear-gradient(135deg,#1e1248 0%,#2d1f6e 40%,#1a3a6e 100%);padding:44px 40px 36px;">
                    <table cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="background:linear-gradient(135deg,#6366f1,#3b82f6);border-radius:8px;width:32px;height:32px;text-align:center;vertical-align:middle;">
                        <span style="color:white;font-size:16px;font-weight:bold;line-height:32px;">P</span>
                        </td>
                        <td style="padding-left:10px;font-family:'Syne',Arial,sans-serif;font-size:16px;font-weight:800;color:#ffffff;letter-spacing:0.08em;">PROJEIC</td>
                    </tr>
                    </table>
                    <p style="margin:24px 0 8px;font-size:11px;color:rgba(167,139,250,0.85);letter-spacing:0.14em;text-transform:uppercase;font-weight:500;">Invitación a colaborar</p>
                    <h1 style="margin:0 0 6px;font-family:'Syne',Arial,sans-serif;font-size:30px;font-weight:700;color:#ffffff;line-height:1.15;">¡Te esperamos<br>en el equipo!</h1>
                    <p style="margin:0;font-size:14px;color:rgba(196,181,253,0.75);font-weight:300;">Alguien quiere trabajar contigo</p>
                </td>
                </tr>

                <!-- Gradient divider -->
                <tr><td style="height:3px;background:linear-gradient(90deg,#6366f1,#3b82f6,#06b6d4);"></td></tr>

                <!-- Body -->
                <tr>
                <td style="padding:36px 40px 32px;">
                    <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;">
                    Hola, un administrador de <strong style="color:#1e1248;">PROJEIC</strong> te ha invitado a unirte como ${role} en el siguiente proyecto:
                    </p>

                    <!-- Project card -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f7ff;border:1px solid #e0d9ff;border-radius:14px;margin:24px 0;">
                    <tr>
                        <td style="padding:18px 20px;">
                        <table cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                            <td width="42" valign="middle" style="padding-right:16px;">
                                <div style="width:42px;height:42px;background:linear-gradient(135deg,#4f46e5,#6366f1);border-radius:10px;text-align:center;line-height:42px;color:white;font-size:20px;">
                                &#9635;
                                </div>
                            </td>
                            <td valign="middle">
                                <p style="margin:0 0 3px;font-size:11px;color:#7c6fc7;text-transform:uppercase;letter-spacing:0.1em;font-weight:500;">Proyecto</p>
                                <p style="margin:0 0 8px;font-family:'Syne',Arial,sans-serif;font-size:17px;font-weight:700;color:#1e1248;">${projectName}</p>
                                <span style="display:inline-block;background:#dcfce7;color:#166534;font-size:11px;font-weight:500;padding:3px 10px;border-radius:100px;margin-right:6px;">${projectStatus}</span>
                                <span style="display:inline-block;background:#e0e7ff;color:#3730a3;font-size:11px;font-weight:500;padding:3px 10px;border-radius:100px;margin-right:6px;">${projectMethodology}</span>
                                ${isInstitutional ? `<span style="display:inline-block;background:#fef9c3;color:#854d0e;font-size:11px;font-weight:500;padding:3px 10px;border-radius:100px;">Institucional</span>` : ''}
                            </td>
                            </tr>
                        </table>
                        </td>
                    </tr>
                    </table>

                    ${
                      projectDescription
                        ? `
                    <p style="margin:0 0 20px;font-size:13px;color:#6b7280;line-height:1.7;background:#fafafa;border-left:3px solid #6366f1;padding:12px 16px;border-radius:0 8px 8px 0;">
                    ${projectDescription}
                    </p>`
                        : ''
                    }

                    <p style="margin:0 0 28px;font-size:14px;color:#6b7280;line-height:1.75;">
                    Al aceptar, tendrás acceso al tablero, tareas, sprints y toda la actividad del proyecto. Tu cuenta se creará automáticamente con Google en segundos.
                    </p>

                    <!-- CTA -->
                    <div style="text-align:center;margin:32px 0 8px;">
                    <a href="${invitationUrl}" style="display:inline-block;background:linear-gradient(135deg,#4f46e5 0%,#6366f1 50%,#3b82f6 100%);color:#ffffff;text-decoration:none;font-family:'Syne',Arial,sans-serif;font-size:15px;font-weight:700;letter-spacing:0.05em;padding:16px 40px;border-radius:50px;box-shadow:0 8px 24px rgba(99,102,241,0.4);">
                        Aceptar invitación →
                    </a>
                    </div>
                    <p style="text-align:center;font-size:12px;color:#9ca3af;margin:10px 0 28px;">El enlace expira en 7 días</p>

                    <!-- Divider -->
                    <div style="height:1px;background:#f0eefc;margin:4px 0 24px;"></div>

                    <!-- Steps -->
                    <p style="margin:0 0 14px;font-family:'Syne',Arial,sans-serif;font-size:13px;font-weight:700;color:#1e1248;letter-spacing:0.06em;text-transform:uppercase;">¿Cómo funciona?</p>
                    <table cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                        <td style="padding-bottom:10px;">
                        <table cellpadding="0" cellspacing="0">
                            <tr>
                            <td width="22" valign="top">
                                <div style="width:22px;height:22px;background:linear-gradient(135deg,#6366f1,#3b82f6);border-radius:50%;text-align:center;line-height:22px;color:white;font-size:11px;font-weight:700;">1</div>
                            </td>
                            <td style="padding-left:12px;font-size:13px;color:#4b5563;line-height:1.5;">Haz clic en el botón y serás redirigido a PROJEIC.</td>
                            </tr>
                        </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding-bottom:10px;">
                        <table cellpadding="0" cellspacing="0">
                            <tr>
                            <td width="22" valign="top">
                                <div style="width:22px;height:22px;background:linear-gradient(135deg,#6366f1,#3b82f6);border-radius:50%;text-align:center;line-height:22px;color:white;font-size:11px;font-weight:700;">2</div>
                            </td>
                            <td style="padding-left:12px;font-size:13px;color:#4b5563;line-height:1.5;">Inicia sesión con tu cuenta de Google en un solo paso.</td>
                            </tr>
                        </table>
                        </td>
                    </tr>
                    <tr>
                        <td>
                        <table cellpadding="0" cellspacing="0">
                            <tr>
                            <td width="22" valign="top">
                                <div style="width:22px;height:22px;background:linear-gradient(135deg,#6366f1,#3b82f6);border-radius:50%;text-align:center;line-height:22px;color:white;font-size:11px;font-weight:700;">3</div>
                            </td>
                            <td style="padding-left:12px;font-size:13px;color:#4b5563;line-height:1.5;">Empieza a colaborar: ve tareas, tableros y sprints de inmediato.</td>
                            </tr>
                        </table>
                        </td>
                    </tr>
                    </table>
                </td>
                </tr>

                <!-- Footer -->
                <tr>
                <td style="background:#fafaf9;border-top:1px solid #f0eefc;padding:24px 40px;text-align:center;">
                    <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
                    Si no esperabas este correo, puedes ignorarlo de forma segura.<br>
                    Enviado por <strong style="color:#6366f1;font-family:'Syne',Arial,sans-serif;">PROJEIC</strong> · Plataforma de gestión ágil de proyectos.
                    </p>
                </td>
                </tr>

            </table>
            </td></tr>
        </table>
        </body>
        </html>
        `,
      });

      this.logger.log(`Invitación enviada exitosamente a ${toEmail}`);
      return { success: true, data };
    } catch (error) {
      this.logger.error(`Error al enviar invitación a ${toEmail}`, error);
      throw new Error('No se pudo enviar el correo de invitación');
    }
  }
}
