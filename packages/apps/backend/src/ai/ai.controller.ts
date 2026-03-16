import type { AiStatusResponse, ChatRequest, ChatResponse } from "@easy-charts/easycharts-types";
import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  ServiceUnavailableException,
  UseGuards,
} from "@nestjs/common";
import { JwdAuthGuard } from "../auth/guards/jwtAuth.guard";
import { AiService } from "./ai.service";

@Controller("ai")
export class AiController {
  constructor(private readonly aiService: AiService) {}

  /** Public endpoint — no auth required — so the frontend can check before login */
  @Get("status")
  getStatus(): AiStatusResponse {
    return { enabled: this.aiService.isEnabled() };
  }

  @Post("chat")
  @UseGuards(JwdAuthGuard)
  async chat(
    @Body() body: ChatRequest,
    @Req() req: { user: string },
  ): Promise<ChatResponse> {
    if (!this.aiService.isEnabled()) {
      throw new ServiceUnavailableException("AI chat is disabled by the administrator");
    }
    return this.aiService.chat(req.user, body.messages, body.currentChartId, body.editorEditMode, body.currentPage, body.currentChartState as any);
  }
}
