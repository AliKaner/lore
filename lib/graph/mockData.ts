import { GraphEdgeData, GraphNodeData } from "./types";

export const mockNodes: GraphNodeData[] = [
  { id: "ch1", type: "chapter", label: "Bölüm 1: Uyanış", subtitle: "Kayıp Krallık" },
  { id: "ch2", type: "chapter", label: "Bölüm 2: Yol Ayrımı", subtitle: "Kayıp Krallık" },
  { id: "ch3a", type: "chapter", label: "Bölüm 3A: Ormana Sapma", subtitle: "Kayıp Krallık" },
  { id: "ch3b", type: "chapter", label: "Bölüm 3B: Şehre Dönüş", subtitle: "Kayıp Krallık" },
  { id: "ch4", type: "chapter", label: "Bölüm 4: Yüzleşme", subtitle: "Kayıp Krallık" },

  { id: "char1", type: "character", label: "Elenwe", subtitle: "Baş Karakter" },
  { id: "char2", type: "character", label: "Kral Doran", subtitle: "Antagonist" },
  { id: "char3", type: "character", label: "Sera", subtitle: "Yardımcı" },

  { id: "loc1", type: "location", label: "Gölge Orman" },
  { id: "loc2", type: "location", label: "Başkent Aurelis" },

  { id: "lore1", type: "lore", label: "Eski Antlaşma", subtitle: "Efsane" },

  { id: "fac1", type: "faction", label: "Gece Muhafızları" },
  { id: "fac2", type: "faction", label: "Kraliyet Ordusu" },
];

export const mockEdges: GraphEdgeData[] = [
  { id: "e1", source: "ch1", target: "ch2", linkType: "next" },
  { id: "e2", source: "ch2", target: "ch3a", linkType: "branch" },
  { id: "e3", source: "ch2", target: "ch3b", linkType: "branch" },
  { id: "e4", source: "ch3a", target: "ch4", linkType: "next" },
  { id: "e5", source: "ch3b", target: "ch4", linkType: "next" },

  { id: "e6", source: "char1", target: "ch1", linkType: "appears_in" },
  { id: "e7", source: "char1", target: "ch2", linkType: "appears_in" },
  { id: "e8", source: "char1", target: "ch4", linkType: "appears_in" },
  { id: "e9", source: "char2", target: "ch3b", linkType: "appears_in" },
  { id: "e10", source: "char2", target: "ch4", linkType: "appears_in" },
  { id: "e11", source: "char3", target: "ch3a", linkType: "appears_in" },

  { id: "e12", source: "char1", target: "fac1", linkType: "member_of" },
  { id: "e13", source: "char2", target: "fac2", linkType: "member_of" },
  { id: "e14", source: "char3", target: "fac1", linkType: "member_of" },

  { id: "e15", source: "ch3a", target: "loc1", linkType: "set_in" },
  { id: "e16", source: "ch3b", target: "loc2", linkType: "set_in" },

  { id: "e17", source: "lore1", target: "fac1", linkType: "related_to" },
  { id: "e18", source: "lore1", target: "fac2", linkType: "related_to" },
];
