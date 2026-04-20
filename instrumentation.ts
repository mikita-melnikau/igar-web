import { headlessCms } from "@/src/services/api/headless-cms.service";
import { logger } from "@/src/lib/api/logger";

export async function register() {
  try {
    await headlessCms.init();
    logger.info("🔥 instrumentation");
  } catch (error) {
    logger.error("instrumentation error", error);
  }
}
