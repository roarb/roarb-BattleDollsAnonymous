import { FactionData } from './warhammer40k';

export const HORUS_HERESY_DATA: FactionData[] = [
  {
    name: "Legiones Astartes",
    models: [
      { name: "MKVI Tactical Squad", points: [{ qty: 20, pts: 200 }], msrp: 80, productUrl: "https://www.warhammer.com/en-US/shop/Legiones-Astartes-MKVI-Tactical-Squad-2022" },
      { name: "MKIII Tactical Squad", points: [{ qty: 20, pts: 200 }], msrp: 80, productUrl: "https://www.warhammer.com/en-US/shop/Legiones-Astartes-MKIII-Tactical-Squad-2023" },
      { name: "Contemptor Dreadnought", points: [{ qty: 1, pts: 175 }], msrp: 60, productUrl: "https://www.warhammer.com/en-US/shop/Legiones-Astartes-Contemptor-Dreadnought-2022" },
      { name: "Spartan Assault Tank", points: [{ qty: 1, pts: 350 }], msrp: 115, productUrl: "https://www.warhammer.com/en-US/shop/Legiones-Astartes-Spartan-Assault-Tank-2022" },
      { name: "Kratos Heavy Assault Tank", points: [{ qty: 1, pts: 300 }], msrp: 130, productUrl: "https://www.warhammer.com/en-US/shop/Legiones-Astartes-Kratos-Heavy-Assault-Tank-2022" }
    ]
  },
  {
    name: "Solar Auxilia",
    models: [
      { name: "Lasrifle Section", points: [{ qty: 20, pts: 100 }], msrp: 75, productUrl: "https://www.warhammer.com/en-US/shop/Solar-Auxilia-Lasrifle-Section-2024" },
      { name: "Dracosan Armoured Transport", points: [{ qty: 1, pts: 150 }], msrp: 80, productUrl: "https://www.warhammer.com/en-US/shop/Solar-Auxilia-Dracosan-Armoured-Transport-2024" }
    ]
  }
];
