// src/lib/trail.ts

export interface Stage {
    name: string;
    id: string;
  }
  
  export type Direction = 'NS' | 'SN' | null;
  
  export const STAGES: Stage[] = [
    { name: "S. Torpes", id: "ST" },
    { name: "Porto Covo", id: "PC" },
    { name: "Vila Nova de Milfontes", id: "VM" },
    { name: "Almograve", id: "AL" },
    { name: "Zambujeira do Mar", id: "ZM" },
    { name: "Odeceixe", id: "OD" },
    { name: "Aljezur", id: "AJ" },
    { name: "Arrifana", id: "AR" },
    { name: "Carrapateira", id: "CP" },
    { name: "Vila do Bispo", id: "VB" },
    { name: "Sagres", id: "SA" },
    { name: "Salema", id: "SL" },
    { name: "Luz", id: "LZ" },
    { name: "Lagos", id: "LG" }
  ];
  
  /**
   * Calculates remaining days based on current location and direction. returns null if no stop is selected.
   */
  export function getRemainingDays(currentId: string, direction: Direction): number | null {
    if (!currentId || !direction) return null;
  
    const ids: string[] = STAGES.map(s => s.id);
    const index: number = ids.indexOf(currentId);
  
    if (index === -1) return null;
  
    return direction === 'NS' 
      ? (ids.length - 1) - index 
      : index;
  }

  /**
   * Helper to get the full segment pairs based on direction
   */
  export function getSegments(direction: Direction): [string, string][] {
    const ids = STAGES.map(s => s.id);
    const segments: [string, string][] = [];
  
    if (direction === 'NS') {
      for (let i = 0; i < ids.length - 1; i++) {
        segments.push([ids[i], ids[i + 1]]);
      }
    } else {
      for (let i = ids.length - 1; i > 0; i--) {
        segments.push([ids[i], ids[i - 1]]);
      }
    }
    return segments;
  }

  /**
 * Generates an array of daily segments [[start, end], [start, end]]
 */
export function generateRoute(startId: string, endId: string): [string, string][] {
    const ids = STAGES.map(s => s.id);
    const startIndex = ids.indexOf(startId);
    const endIndex = ids.indexOf(endId);
  
    if (startIndex === -1 || endIndex === -1 || startIndex === endIndex) {
      return [];
    }
  
    const segments: [string, string][] = [];
    
    if (startIndex < endIndex) {
      // North to South
      for (let i = startIndex; i < endIndex; i++) {
        segments.push([ids[i], ids[i + 1]]);
      }
    } else {
      // South to North
      for (let i = startIndex; i > endIndex; i--) {
        segments.push([ids[i], ids[i - 1]]);
      }
    }
  
    return segments;
  }
  
  /**
   * Helper to add days to a date string
   */
  export function formatDate(startDate: string, daysToAdd: number): string {
    const date = new Date(startDate);
    date.setDate(date.getDate() + daysToAdd);
    return date.toLocaleDateString('en-GB', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    });
  }