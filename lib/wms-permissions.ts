export const WMS_MODULES = [
  'dashboard',
  'recebimento',
  'estoque',
  'enderecamento',
  'movimentacoes',
  'picking',
  'expedicao',
  'inventario',
  'relatorios',
  'usuarios',
  'configuracoes',
] as const;

export type WmsModule = (typeof WMS_MODULES)[number];

export type PermissionAction =
  | 'visualizar'
  | 'criar'
  | 'editar'
  | 'excluir'
  | 'aprovar';

export type ModulePermission = Record<PermissionAction, boolean>;

export type UserPermissions = Partial<Record<WmsModule, ModulePermission>>;

export function can(
  permissions: UserPermissions | undefined,
  module: WmsModule,
  action: PermissionAction,
) {
  return permissions?.[module]?.[action] === true;
}
