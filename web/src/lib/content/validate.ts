import type { ToolContent } from "./types";

/**
 * ToolContent 质量检查（纯 helper，开发辅助）
 *
 * 用途：
 * - 内容开发期快速检查 MDX 结构完整性（validate 输出 warnings）
 * - 不抛异常 / 不影响 build / 不接入 CI gate（仅开发辅助）
 *
 * 返回：
 * - valid：是否无任何 warning
 * - warnings：结构问题列表（空 = 无问题）
 */
export interface ToolContentValidation {
  valid: boolean;
  warnings: string[];
}

export function validateToolContent(content: ToolContent | null): ToolContentValidation {
  if (!content) {
    return { valid: false, warnings: ["content missing"] };
  }

  const warnings: string[] = [];

  // 2. introduction 不存在
  if (!content.introduction) {
    warnings.push("missing introduction");
  }

  // 3. features 存在但不足 2 项
  if (content.features && content.features.length < 2) {
    warnings.push("features should have at least 2 items");
  }

  // 4. examples 不存在 / 不足 1 项
  if (!content.examples) {
    warnings.push("missing examples");
  } else if (content.examples.length < 1) {
    warnings.push("examples should have at least 1 item");
  }

  // 5. faqs 存在但不足 2 项
  if (content.faqs && content.faqs.length < 2) {
    warnings.push("faqs should have at least 2 items");
  }

  // 6. guide 存在时检查 step 连续性（如 [1, 3] → 不连续）
  if (content.guide && content.guide.length > 0) {
    const steps = content.guide.map((g) => g.step).sort((a, b) => a - b);
    for (let i = 1; i < steps.length; i++) {
      if (steps[i] !== steps[i - 1] + 1) {
        warnings.push("guide steps are not continuous");
        break;
      }
    }
  }

  return { valid: warnings.length === 0, warnings };
}
