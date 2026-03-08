import type { AssemblyItem, BOMLine, TrapezTemplate, TraySystem } from '@/types';

function pushDerivedItems(
  lines: BOMLine[],
  system: TraySystem,
  items: AssemblyItem[],
  multiplier: number,
  label: string,
) {
  for (const item of items) {
    lines.push({
      system_name: system.name,
      item_name: item.name,
      qty: item.qty * multiplier,
      unit: item.unit,
      derivation: `${multiplier} ${label} x ${item.qty} ${item.unit}`,
    });
  }
}

export function calculateSimpleBOM(systems: TraySystem[], templates: TrapezTemplate[]): BOMLine[] {
  const lines: BOMLine[] = [];

  for (const system of systems) {
    const template = templates.find((entry) => entry.id === system.template_id);
    if (!template) continue;

    const sections = Math.ceil(system.total_length_m / 3);
    if (sections > 0) {
      pushDerivedItems(lines, system, template.per_section ?? [], sections, 'sections');
    }

    if (system.trapeze_count > 0) {
      pushDerivedItems(lines, system, template.per_trapeze ?? [], system.trapeze_count, 'trapezes');
    }

    if (system.corner_count > 0) {
      if ((template.per_corner ?? []).length > 0) {
        pushDerivedItems(lines, system, template.per_corner, system.corner_count, 'corners');
      } else {
        lines.push({
          system_name: system.name,
          item_name: 'Corner / bend',
          qty: system.corner_count,
          unit: 'each',
          derivation: `${system.corner_count} corners counted`,
        });
      }
    }

    if (system.tee_count > 0) {
      if ((template.per_tee ?? []).length > 0) {
        pushDerivedItems(lines, system, template.per_tee, system.tee_count, 'tees');
      } else {
        lines.push({
          system_name: system.name,
          item_name: 'Tee junction',
          qty: system.tee_count,
          unit: 'each',
          derivation: `${system.tee_count} tees counted`,
        });
      }
    }

    if (system.reducer_count > 0) {
      if ((template.per_reducer ?? []).length > 0) {
        pushDerivedItems(lines, system, template.per_reducer, system.reducer_count, 'reducers');
      } else {
        lines.push({
          system_name: system.name,
          item_name: 'Reducer',
          qty: system.reducer_count,
          unit: 'each',
          derivation: `${system.reducer_count} reducers counted`,
        });
      }
    }
  }

  const consolidated: BOMLine[] = [];
  for (const line of lines) {
    const existing = consolidated.find((entry) => (
      entry.system_name === line.system_name
      && entry.item_name === line.item_name
      && entry.unit === line.unit
    ));

    if (existing) {
      existing.qty += line.qty;
      existing.derivation = `${existing.derivation} + ${line.derivation}`;
    } else {
      consolidated.push({ ...line });
    }
  }

  return consolidated;
}
