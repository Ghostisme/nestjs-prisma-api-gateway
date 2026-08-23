/**
 * 日期格式化与部门映射工具。
 *
 * dept_id → 部门名称的映射暂为硬编码（与 mock 数据一致），
 * 后续接入 Java UPMS 后改为动态获取。
 */

const DEPT_MAP: Record<number, string> = {
  1: '技术部',
  2: '运营部',
  3: '市场部',
  4: '产品部',
  5: '销售部',
};

export function deptName(deptId: number | null | undefined): string {
  if (deptId === null || deptId === undefined) return '-';
  return DEPT_MAP[deptId] ?? `部门${deptId}`;
}

export function deptIdsByName(name: string): number[] {
  return Object.entries(DEPT_MAP)
    .filter(([, v]) => v.includes(name))
    .map(([k]) => Number(k));
}

export function fmtDate(date: Date | string | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '-';

  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
