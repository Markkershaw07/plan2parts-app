import type { TraySystem, TrapezTemplate, BOMLine } from '@/types';

export function calculateSimpleBOM(
  systems: TraySystem[],
  templates: TrapezTemplate[],
): BOMLine[] {
  const lines: BOMLine[] = [];

  for (const sys of systems) {
    const tpl = templates.find((t) => t.id === sys.template_id);
    if (!tpl) continue;

    // Per 3m section — joining hardware + tray lengths
    const perSection = tpl.per_section ?? [];
    if (perSection.length > 0) {
      const sections = Math.ceil(sys.total_length_m / 3);
      for (const item of perSection) {
        lines.push({
          system_name: sys.name,
          item_name: item.name,
          qty: item.qty * sections,
          unit: item.unit,
          derivation: `${sections} sections × ${item.qty} ${item.unit}`,
        });
      }
    }

    // Per trapeze — hanger assembly
    if (sys.trapeze_count > 0) {
      for (const item of tpl.per_trapeze) {
        lines.push({
          system_name: sys.name,
          item_name: item.name,
          qty: item.qty * sys.trapeze_count,
          unit: item.unit,
          derivation: `${sys.trapeze_count} trapezes × ${item.qty} ${item.unit}`,
        });
      }
    }

    // Per corner — joining hardware at bends
    const perCorner = tpl.per_corner ?? [];
    if (sys.corner_count > 0) {
      if (perCorner.length > 0) {
        for (const item of perCorner) {
          lines.push({
            system_name: sys.name,
            item_name: item.name,
            qty: item.qty * sys.corner_count,
            unit: item.unit,
            derivation: `${sys.corner_count} corners × ${item.qty} ${item.unit}`,
          });
        }
      } else {
        lines.push({ system_name: sys.name, item_name: '90° corner/bend', qty: sys.corner_count, unit: 'each', derivation: `${sys.corner_count} corners counted` });
      }
    }

    if (sys.tee_count > 0) {
      lines.push({ system_name: sys.name, item_name: 'Tee junction', qty: sys.tee_count, unit: 'each', derivation: `${sys.tee_count} tees counted` });
    }
    if (sys.reducer_count > 0) {
      lines.push({ system_name: sys.name, item_name: 'Reducer', qty: sys.reducer_count, unit: 'each', derivation: `${sys.reducer_count} reducers counted` });
    }
  }

  // Consolidate rows with same system + item + unit
  const consolidated: BOMLine[] = [];
  for (const line of lines) {
    const existing = consolidated.find(
      r => r.system_name === line.system_name && r.item_name === line.item_name && r.unit === line.unit
    );
    if (existing) {
      existing.qty += line.qty;
      existing.derivation += ` + ${line.derivation}`;
    } else {
      consolidated.push({ ...line });
    }
  }
  return consolidated;
}
