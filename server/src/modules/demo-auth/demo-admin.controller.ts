import { All, Controller, Req } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';

/**
 * 演示占位控制器（仅在 AUTH_MOCK=true 时注册）。
 *
 * 背景：前端有一整批管理类接口（/admin/account、/admin/role、/admin/dept、
 * /admin/tenant、/admin/user/availableAgents 等）原本由下游 Java 后端实现，
 * 网关只负责转发。演示环境（Vercel）没有下游 Java，转发必然失败，导致这些
 * 管理页面一打开就报错。
 *
 * 本控制器用一个 catch-all 路由兜底所有 /admin/* 请求，按路径特征返回“形状正确、
 * 内容为空”的占位数据，保证：
 *   - 列表/分页页面能打开、显示空表格而非报错；
 *   - 下拉/树选择器拿到空数组而不抛异常（前端多处对返回值做 .map）；
 *   - 详情弹窗拿到空对象；
 *   - 增删改等写操作返回成功，不阻塞交互。
 *
 * 返回体只需裸数据：ResponseInterceptor 会自动包成 { code: 0, msg, data }，
 * 满足前端 apiClient「code===0 且取 data」的约定。
 *
 * 注意：这是演示占位，不做任何真实持久化。切勿在接真实用户的环境启用 AUTH_MOCK。
 */
@ApiExcludeController()
@Controller('admin')
export class DemoAdminController {
  /**
   * 兜底所有 /admin/** 路径与方法。根据路径关键字推断前端期望的数据形状：
   * 分页列表 → 空 PageResult；列表/树/下拉 → 空数组；详情 → 空对象；
   * 其余（含写操作）→ true。
   */
  @Public()
  @All('*path')
  handle(@Req() req: Request): unknown {
    // 去掉全局前缀与查询串，只保留 /admin 之后的纯路径用于特征匹配。
    const path = (req.path || req.url || '').split('?')[0].toLowerCase();
    const method = (req.method || 'GET').toUpperCase();

    // availableAgents：登录后立即被 AgentSelect 调用，必须是数组（前端 .map）。
    if (path.endsWith('/user/availableagents')) {
      return [];
    }

    // 分页列表：路径以 /page 结尾，或部门用户列表 /dept/users。
    if (path.endsWith('/page') || path.endsWith('/dept/users')) {
      return this.emptyPage(req);
    }

    // 数组类：列表 / 树 / 下拉选项 / 分组等，前端普遍对返回值做数组遍历。
    if (this.isArrayShape(path)) {
      return [];
    }

    // 详情类：/details、/info 等单对象弹窗。
    if (path.includes('/details') || path.endsWith('/info')) {
      return {};
    }

    // 其余：save/update/enable/disable/delete/resetPassword 等写操作，返回成功。
    // GET 兜底也返回空对象，避免前端拿到 true 后做属性访问报错。
    return method === 'GET' ? {} : true;
  }

  /** 构造前端 CommonList/PageResult 期望的空分页结构，尽量沿用请求里的分页参数。 */
  private emptyPage(req: Request): Record<string, unknown> {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const query = req.query ?? {};
    const toNum = (v: unknown, fallback: number): number => {
      const n = Number(v);
      return Number.isFinite(n) && n > 0 ? n : fallback;
    };
    const size = toNum(body.size ?? query.size, 10);
    const current = toNum(body.current ?? query.current, 1);
    return { records: [], total: 0, size, current, pages: 0 };
  }

  /**
   * 判断该路径前端是否期望数组返回。覆盖 simpleAll / simpleList / roleMenus /
   * groupList / listAll / areaTree / dept/info(树) / user/roleList /
   * capability/simpleList 等已知数组接口，并对通用的 list/tree/all 结尾兜底。
   */
  private isArrayShape(path: string): boolean {
    const arraySuffixes = [
      '/simpleall',
      '/simplelist',
      '/rolemenus',
      '/grouplist',
      '/listall',
      '/areatree',
      '/dept/info',
      '/user/rolelist',
    ];
    if (arraySuffixes.some((s) => path.endsWith(s))) return true;
    // 通用兜底：以 list / tree / all 结尾的接口约定返回数组。
    return /(list|tree|all)$/.test(path);
  }
}
