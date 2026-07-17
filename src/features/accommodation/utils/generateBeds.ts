export interface GenerateBedsInputArea {
  name: string;
  bedPrefix: string;
  bedCount: number;
}

export interface GeneratedAreaBeds {
  name: string;
  bedPrefix: string;
  bedIds: string[];
}

export interface GenerateBedsResult {
  areas: GeneratedAreaBeds[];
  totalCapacity: number;
}

/**
 * Pure function that generates bed IDs and total capacity from area configurations.
 * Formats each bed ID as `{prefix}{index}` (e.g. `B1`, `B2`).
 */
export function generateBeds(areas: GenerateBedsInputArea[]): GenerateBedsResult {
  let totalCapacity = 0;

  const generatedAreas = areas.map((area) => {
    const bedIds: string[] = [];
    const prefix = area.bedPrefix.trim().toUpperCase();
    
    // Ensure we handle invalid/negative numbers gracefully by using Math.max(0)
    const count = Math.max(0, area.bedCount);

    for (let i = 1; i <= count; i++) {
      if (prefix) {
        bedIds.push(`${prefix}${i}`);
      }
    }

    totalCapacity += bedIds.length;

    return {
      name: area.name.trim(),
      bedPrefix: prefix,
      bedIds,
    };
  });

  return {
    areas: generatedAreas,
    totalCapacity,
  };
}
