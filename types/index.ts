// Plan2Parts — TypeScript Types (v0.3)

export interface AssemblyItem {
  id: string
  name: string
  qty: number
  unit: 'each' | 'm'
}

export interface TrapezTemplate {
  id: string
  name: string
  per_trapeze: AssemblyItem[]
  per_section: AssemblyItem[]   // per 3m tray length (joins + tray itself)
  per_corner: AssemblyItem[]    // per corner/bend
}

export interface TraySystem {
  id: string
  name: string
  colour: string
  template_id: string
  total_length_m: number
  trapeze_count: number
  corner_count: number
  tee_count: number
  reducer_count: number
  confidence: 'high' | 'medium' | 'low'
}

export interface ClaudeAnalysisResult {
  has_scale: boolean
  scale_note: string
  systems: {
    colour: string
    description: string
    total_length_m: number | null
    trapeze_count: number
    corner_count: number
    tee_count: number
    reducer_count: number
    confidence: 'high' | 'medium' | 'low'
  }[]
  notes: string
}

export interface BOMLine {
  system_name: string
  item_name: string
  qty: number
  unit: string
  derivation: string
}

export interface PageScale {
  pixel_distance: number
  real_distance_m: number
  point_a: [number, number]
  point_b: [number, number]
  scale_factor_m_per_px: number
}

export interface PlanPage {
  page_number: number
  image_url: string
  width_px: number
  height_px: number
  scale?: PageScale
  rotation_deg: 0 | 90 | 180 | 270
}

export interface Job {
  id: string
  name: string
  site: string
  created_at: string
  updated_at: string
  systems: TraySystem[]
  plan_pages: PlanPage[]
  analysis_raw?: string
}
