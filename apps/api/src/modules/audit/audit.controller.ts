import { Controller, Get, Query } from "@nestjs/common"
import { AuditService } from "./audit.service"

@Controller("audit")
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

  @Get("metrics")
  async getMetrics() {
    return this.auditService.getMetrics()
  }
}
