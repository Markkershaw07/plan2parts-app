import type { TraySystem, TrapezTemplate, BOMLine } from '@/types';

export function calculateSimpleBOM(
  systems: TraySystem[],
  templates: TrapezTemplate[],
): BOMLine[] {
  const lines: BOMLine[] = [];

  for (const sys of systems) {
    const tpl = templates.find((t) => t.id === sys.template_id);
    if (!tpl) continue;

    const joinCount = Math.max(0, Math.ceil(sys.total_length_m / tpl.stick_length_m) - 1);

    lines.push({
      system_name: sys.name,
      item_name: 'Cable tray',
      qty: sys.total_length_m,
      unit: 'm',
      derivation: `${sys.total_length_m}m total run`,
    });

    for (const item of tpl.per_trapeze) {
      if (sys.trapeze_count === 0) continue;
      lines.push({
        system_name: sys.name,
        item_name: item.name,
        qty: item.qty * sys.trapeze_count,
        unit: item.unit,
        derivation: `${sys.trapeze_count} trapezes x ${item.qty} ${item.unit}`,
      });
    }

    for (const item of tpl.per_join) {
      if (joinCount === 0) continue;
      lines.push({
        system_name: sys.name,
        item_name: item.name,
        qty: item.qty * joinCount,
        unit: item.unit,
        derivation: `${joinCount} joins x ${item.qty} ${item.unit}`,
      });
    }

    if (sys.corner_count > 0) {
      lines.push({ system_name: sys.name, item_name: '90 corner/bend', qty: sys.corner_count, unit: 'each', derivation: `${sys.corner_count} corners counted` });
    }
    if (sys.tee_count > 0) {
      lines.push({ system_name: sys.name, item_name: 'Tee junction', qty: sys.tee_count, unit: 'each', derivation: `${sys.tee_count} tees counted` });
    }
    if (sys.reducer_count > 0) {
      lines.push({ system_name: sys.name, item_name: 'Reducer', qty: sys.reducer_count, unit: 'each', derivation: `${sys.reducer_count} reducers counted` });
    }
  }

  return lines;
}
