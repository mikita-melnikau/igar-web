import { config } from "@/config";
import { headlessCms } from "@/src/services/api/headless-cms.service";

type HeartbeatState = {
  ok: boolean;
  checkedAt: number;
};

class HeartbeatService {
  private state: HeartbeatState | null = null;
  private inFlight: Promise<boolean> | null = null;
  private readonly ttlMs = 30_000;
  private readonly timeoutMs = 1_000;

  private async pingWithTimeout(): Promise<boolean> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const heartbeatUrl = `${config.SOURCE_WEBSITE}${headlessCms.data.api.pingEndpoint}`;
      const res = await fetch(heartbeatUrl, {
        method: "GET",
        signal: controller.signal,
        cache: "no-store",
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      clearTimeout(timer);
    }
  }

  private async checkTwice(): Promise<boolean> {
    const first = await this.pingWithTimeout();
    if (!first) return false;
    return await this.pingWithTimeout();
  }

  async getStatus(): Promise<boolean> {
    const now = Date.now();
    if (this.state && now - this.state.checkedAt < this.ttlMs) {
      return this.state.ok;
    }
    if (this.inFlight) {
      return this.inFlight;
    }
    this.inFlight = this.checkTwice()
      .then((ok) => {
        this.state = {
          ok,
          checkedAt: Date.now(),
        };
        return ok;
      })
      .finally(() => {
        this.inFlight = null;
      });

    return this.inFlight;
  }
}

export const heartbeatService = new HeartbeatService();
