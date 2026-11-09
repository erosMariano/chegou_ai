import { Injectable, Logger } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { Resend } from "resend"

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name)
  private readonly resend: Resend | null = null
  private readonly defaultFrom: string

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>("RESEND_API_KEY")?.trim()
    this.defaultFrom =
      this.config.get<string>("EMAIL_FROM")?.trim() ||
      "Chegou.AI <onboarding@resend.dev>"

    if (apiKey) {
      this.resend = new Resend(apiKey)
      this.logger.log("✅ Serviço de e-mail Resend inicializado com sucesso.")
    } else {
      this.logger.warn(
        "⚠️ RESEND_API_KEY não configurada no .env. E-mails serão apenas registrados no console (modo dev)."
      )
    }
  }

  /**
   * Dispara e-mail de boas-vindas e convite para ativação de conta do novo morador
   */
  async sendResidentInviteEmail(params: {
    to: string
    residentName: string
    unitInfo: string
    inviteUrl: string
  }): Promise<boolean> {
    const { to, residentName, unitInfo, inviteUrl } = params

    this.logger.log(`[MailService] Enviando convite de ativação para: ${to}`)

    if (!this.resend) {
      this.logger.log(
        `[MOCK EMAIL RESEND] Para: ${to} | Link de Ativação: ${inviteUrl}`
      )
      return true
    }

    const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ativação de Conta — Chegou.AI</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F4F4F3; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #18181B;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F4F4F3; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" max-width="560px" style="max-width: 560px; background-color: #FFFFFF; border-radius: 24px; border: 1px solid #E4E4E7; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          
          <!-- Header escuro com estilo Vault -->
          <tr>
            <td style="background-color: #18181B; padding: 32px 36px; text-align: left;">
              <table role="presentation" width="100%">
                <tr>
                  <td>
                    <span style="font-size: 20px; font-weight: 900; letter-spacing: -0.5px; color: #FFFFFF;">
                      CHEGOU<span style="color: #E1FF01;">.AI</span>
                    </span>
                    <span style="display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #A1A1AA; margin-top: 4px;">
                      Avisos Inteligentes de Encomendas
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Corpo do E-mail -->
          <tr>
            <td style="padding: 36px 36px 28px 36px;">
              <h1 style="font-size: 22px; font-weight: 800; color: #18181B; margin: 0 0 16px 0; letter-spacing: -0.5px;">
                Olá, ${residentName}! 👋
              </h1>
              <p style="font-size: 14px; line-height: 22px; color: #52525B; margin: 0 0 20px 0;">
                A administração do seu condomínio acabou de cadastrar você no <strong>Chegou.AI</strong> vinculado à unidade <strong>${unitInfo}</strong>.
              </p>
              <p style="font-size: 14px; line-height: 22px; color: #52525B; margin: 0 0 28px 0;">
                Com o Chegou.AI, você recebe avisos instantâneos sempre que uma encomenda chegar para o seu apartamento na portaria, acompanhado do seu <strong>Passe Digital com QR Code e PIN</strong> para retirada segura.
              </p>

              <!-- Botão de Ação CTA -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 28px;">
                <tr>
                  <td align="center">
                    <a href="${inviteUrl}" target="_blank" style="display: inline-block; background-color: #18181B; color: #FFFFFF; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 12px; border: 1px solid #27272A;">
                      Ativar Minha Conta &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Caixa informativa -->
              <table role="presentation" width="100%" style="background-color: #F4F4F5; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px;">
                <tr>
                  <td>
                    <p style="font-size: 12px; line-height: 18px; color: #71717A; margin: 0;">
                      🔒 <strong>Segurança:</strong> Este link é individual e expira em 7 dias. Ao clicar, você criará sua senha pessoal de acesso.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Link alternativo por extenso -->
              <p style="font-size: 12px; line-height: 18px; color: #A1A1AA; margin: 0;">
                Se o botão acima não funcionar, copie e cole este link diretamente no seu navegador:<br>
                <a href="${inviteUrl}" style="color: #18181B; word-break: break-all; font-family: monospace; font-size: 11px;">${inviteUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Rodapé -->
          <tr>
            <td style="background-color: #FAFAFA; border-top: 1px solid #E4E4E7; padding: 20px 36px; text-align: center;">
              <p style="font-size: 11px; color: #A1A1AA; margin: 0;">
                &copy; ${new Date().getFullYear()} Chegou.AI &bull; Sistema Inteligente de Gestão de Encomendas.<br>
                Em conformidade com a LGPD.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

    try {
      let fromSender = this.defaultFrom
      let response = await this.resend.emails.send({
        from: fromSender,
        to: [to],
        subject: `Chegou.AI — Ative sua conta no condomínio (${unitInfo})`,
        html: htmlContent,
      })

      // Fallback automático para modo sandbox se o domínio customizado ainda não estiver verificado no Resend
      if (
        response.error &&
        response.error.message?.includes("is not verified") &&
        fromSender !== "Chegou.AI <onboarding@resend.dev>"
      ) {
        this.logger.warn(
          `[MailService] Domínio não verificado no Resend. Reenviando automaticamente via sandbox: onboarding@resend.dev`
        )
        fromSender = "Chegou.AI <onboarding@resend.dev>"
        response = await this.resend.emails.send({
          from: fromSender,
          to: [to],
          subject: `Chegou.AI — Ative sua conta no condomínio (${unitInfo})`,
          html: htmlContent,
        })
      }

      if (response.error) {
        this.logger.error(
          `[MailService] Erro ao enviar e-mail via Resend: ${response.error.message}`
        )
        return false
      }

      this.logger.log(
        `[MailService] E-mail de ativação despachado com sucesso! ID: ${response.data?.id} (via ${fromSender})`
      )
      return true
    } catch (err: any) {
      this.logger.error(
        `[MailService] Exceção ao despachar e-mail via Resend: ${err.message}`
      )
      return false
    }
  }

  /**
   * Dispara e-mail de recuperação / redefinição de senha
   */
  async sendPasswordResetEmail(params: {
    to: string
    userName: string
    resetUrl: string
  }): Promise<boolean> {
    const { to, userName, resetUrl } = params

    this.logger.log(`[MailService] Enviando link de redefinição para: ${to}`)

    if (!this.resend) {
      this.logger.log(
        `[MOCK EMAIL RESEND] Para: ${to} | Link de Redefinição: ${resetUrl}`
      )
      return true
    }

    const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Redefinição de Senha — Chegou.AI</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F4F4F3; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #18181B;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F4F4F3; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" max-width="560px" style="max-width: 560px; background-color: #FFFFFF; border-radius: 24px; border: 1px solid #E4E4E7; overflow: hidden;">
          <tr>
            <td style="background-color: #18181B; padding: 32px 36px;">
              <span style="font-size: 20px; font-weight: 900; color: #FFFFFF;">
                CHEGOU<span style="color: #E1FF01;">.AI</span>
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding: 36px 36px 28px 36px;">
              <h1 style="font-size: 20px; font-weight: 800; color: #18181B; margin: 0 0 16px 0;">
                Redefinição de Senha
              </h1>
              <p style="font-size: 14px; line-height: 22px; color: #52525B; margin: 0 0 20px 0;">
                Olá, ${userName}! Recebemos uma solicitação para redefinir a sua senha de acesso ao Chegou.AI.
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" target="_blank" style="display: inline-block; background-color: #18181B; color: #FFFFFF; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 12px;">
                      Criar Nova Senha &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <p style="font-size: 12px; line-height: 18px; color: #71717A;">
                🔒 Este link expira em 15 minutos. Caso você não tenha solicitado esta troca, pode ignorar este e-mail.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

    try {
      let fromSender = this.defaultFrom
      let response = await this.resend.emails.send({
        from: fromSender,
        to: [to],
        subject: "Chegou.AI — Recuperação de Senha",
        html: htmlContent,
      })

      if (
        response.error &&
        response.error.message?.includes("is not verified") &&
        fromSender !== "Chegou.AI <onboarding@resend.dev>"
      ) {
        this.logger.warn(
          `[MailService] Domínio não verificado no Resend. Reenviando automaticamente via sandbox: onboarding@resend.dev`
        )
        fromSender = "Chegou.AI <onboarding@resend.dev>"
        response = await this.resend.emails.send({
          from: fromSender,
          to: [to],
          subject: "Chegou.AI — Recuperação de Senha",
          html: htmlContent,
        })
      }

      if (response.error) {
        this.logger.error(
          `[MailService] Erro ao enviar redefinição via Resend: ${response.error.message}`
        )
        return false
      }

      this.logger.log(
        `[MailService] E-mail de redefinição despachado com sucesso! ID: ${response.data?.id} (via ${fromSender})`
      )
      return true
    } catch (err: any) {
      this.logger.error(
        `[MailService] Exceção ao enviar redefinição via Resend: ${err.message}`
      )
      return false
    }
  }
}

