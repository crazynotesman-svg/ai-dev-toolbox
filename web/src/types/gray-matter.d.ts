/**
 * gray-matter 类型声明
 * gray-matter@4 自带 gray-matter.d.ts 但 package.json 未声明 types 字段，
 * TS 无法自动解析，这里显式 re-export 包内类型。
 */
declare module "gray-matter" {
  import matter from "gray-matter/gray-matter";
  export * from "gray-matter/gray-matter";
  export default matter;
}
