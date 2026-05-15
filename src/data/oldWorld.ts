import { FactionData } from './warhammer40k';

export const OLD_WORLD_DATA: FactionData[] = [
  {
    name: "Kingdom of Bretonnia",
    models: [
      { name: "Men-at-Arms", points: [{ qty: 20, pts: 100 }], msrp: 60, productUrl: "https://www.warhammer.com/en-US/shop/Bretonnian-Men-at-Arms-2024" },
      { name: "Peasant Bowmen", points: [{ qty: 20, pts: 100 }], msrp: 60, productUrl: "https://www.warhammer.com/en-US/shop/Bretonnian-Peasant-Bowmen-2024" },
      { name: "Knights of the Realm", points: [{ qty: 12, pts: 288 }], msrp: 80, productUrl: "https://www.warhammer.com/en-US/shop/Bretonnian-Knights-of-the-Realm-2024" },
      { name: "Pegasus Knights", points: [{ qty: 3, pts: 165 }], msrp: 60, productUrl: "https://www.warhammer.com/en-US/shop/Bretonnian-Pegasus-Knights-2024" }
    ]
  },
  {
    name: "Tomb Kings of Khemri",
    models: [
      { name: "Skeleton Warriors", points: [{ qty: 40, pts: 200 }], msrp: 80, productUrl: "https://www.warhammer.com/en-US/shop/Tomb-Kings-Skeleton-Warriors-2024" },
      { name: "Skeleton Archers", points: [{ qty: 40, pts: 200 }], msrp: 80, productUrl: "https://www.warhammer.com/en-US/shop/Tomb-Kings-Skeleton-Archers-2024" },
      { name: "Tomb Guard", points: [{ qty: 20, pts: 200 }], msrp: 75, productUrl: "https://www.warhammer.com/en-US/shop/Tomb-Kings-Tomb-Guard-2024" },
      { name: "Necrosphinx", points: [{ qty: 1, pts: 195 }], msrp: 75, productUrl: "https://www.warhammer.com/en-US/shop/Tomb-Kings-Necrosphinx-2024" }
    ]
  }
];
