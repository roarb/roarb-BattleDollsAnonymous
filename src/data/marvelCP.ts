import { FactionData } from './warhammer40k';

export const MARVEL_CP_DATA: FactionData[] = [
  {
    name: "Avengers",
    models: [
      { name: "Captain America (Steve Rogers)", points: [{ qty: 1, pts: 4 }], msrp: 40, productUrl: "https://www.atomicmassgames.com/mcp-core-set" },
      { name: "Iron Man (Tony Stark)", points: [{ qty: 1, pts: 3 }], msrp: 40, productUrl: "https://www.atomicmassgames.com/mcp-core-set" },
      { name: "Black Widow (Natasha Romanoff)", points: [{ qty: 1, pts: 2 }], msrp: 40, productUrl: "https://www.atomicmassgames.com/mcp-core-set" },
      { name: "Thor, Prince of Asgard", points: [{ qty: 1, pts: 5 }], msrp: 45, productUrl: "https://www.atomicmassgames.com/mcp-expansions" }
    ]
  },
  {
    name: "Spider-Foes",
    models: [
      { name: "Green Goblin", points: [{ qty: 1, pts: 4 }], msrp: 40, productUrl: "https://www.atomicmassgames.com/mcp-expansions" },
      { name: "Doctor Octopus", points: [{ qty: 1, pts: 3 }], msrp: 40, productUrl: "https://www.atomicmassgames.com/mcp-core-set" },
      { name: "Venom", points: [{ qty: 1, pts: 4 }], msrp: 40, productUrl: "https://www.atomicmassgames.com/mcp-expansions" }
    ]
  }
];
