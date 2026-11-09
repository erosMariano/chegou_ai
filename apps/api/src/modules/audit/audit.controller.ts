import { Controller, Get, Query, UseGuards, Res } from "@nestjs/common"
import { AuditService } from "./audit.service"
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard"
import { RolesGuard } from "@/common/guards/roles.guard"
import { Roles } from "@/common/decorators/roles.decorator"
import { UserRole } from "@prisma/client"

@Controller("audit")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get("events")
  async getEvents(
    @Query("eventType") eventType?: string,
    @Query("packageId") packageId?: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number
  ) {
    const res = await this.auditService.findAllEvents({ eventType, packageId, page, limit })
    if (!page) {
      return res.items
    }
    return res
  }

  @Get("export")
  async exportCsv(@Res() res: any) {
    const csv = await this.auditService.exportCsv()
    res.setHeader("Content-Type", "text/csv; charset=utf-8")
    res.setHeader("Content-Disposition", 'attachment; filename="auditoria-chegou-ai.csv"')
    return res.send(csv)
  }

  @Get("metrics")
  async getMetrics() {
    return this.auditService.getMetrics()
  }
}
