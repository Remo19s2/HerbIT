const samplePlants = [
  {
    name: "Tulsi (Holy Basil)",
    scientificName: "Ocimum tenuiflorum",
    category: "Ayurvedic",
    description: "Tulsi is revered in India as the 'Queen of Herbs' and is an essential cornerstone of Ayurvedic wellness traditions. It is recognized for its adaptogenic properties and aromatic foliage.",
    benefits: "Traditionally used to support respiratory health, promote vitality, help soothe seasonal colds, and assist the body in adapting to daily physical stress.",
    partsUsed: "Leaves, seeds, and essential oil extract",
    cultivation: "Thrives in warm, tropical conditions with ample sunlight (at least 6 hours daily). Requires well-draining loamy soil with regular moderate watering.",
    image: "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Neem",
    scientificName: "Azadirachta indica",
    category: "Medicinal",
    description: "Neem is a fast-growing evergreen tree native to the Indian subcontinent, frequently celebrated for its wide array of traditional therapeutic and insect-repelling virtues.",
    benefits: "Commonly used in traditional preparations for skin wellness, oral hygiene maintenance (neem twigs), and natural insect repellent formulations.",
    partsUsed: "Leaves, bark, seeds, and neem oil",
    cultivation: "Drought-tolerant tree that thrives in sub-arid to sub-humid tropical climates. Tolerates various soil types, preferring deep, well-drained sandy soil.",
    image: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Aloe Vera",
    scientificName: "Aloe barbadensis miller",
    category: "Medicinal",
    description: "Aloe Vera is a succulent plant species known worldwide for its thick, fleshy leaves containing a soothing, nutrient-dense natural gel.",
    benefits: "Traditionally used topically to soothe minor skin irritations, provide hydration for sunburns, and support skin barrier recovery.",
    partsUsed: "Clear inner leaf gel and leaf latex",
    cultivation: "Requires plenty of bright, indirect sunlight and porous cactus potting mix. Minimal watering needed; allow soil to dry completely between waterings.",
    image: "https://images.unsplash.com/photo-1567689574447-0e6d6d755502?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Ginger",
    scientificName: "Zingiber officinale",
    category: "Common Herbs",
    description: "Ginger is a flowering plant whose pungent, aromatic rhizome is globally prized both as a culinary spice and in folk herbal practices.",
    benefits: "Widely used in traditional brews to ease mild digestive discomfort, soothe temporary nausea, and support warming seasonal comfort.",
    partsUsed: "Underground rhizome (root)",
    cultivation: "Prefers warm, humid, partially shaded environments with rich, loose, humus-rich soil. Requires consistent moisture without waterlogging.",
    image: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Turmeric",
    scientificName: "Curcuma longa",
    category: "Ayurvedic",
    description: "Turmeric is a bright golden-yellow rhizomatous herb belonging to the ginger family, celebrated as a sacred botanical and dietary antioxidant source.",
    benefits: "Contains curcumin, traditionally utilized to support joint flexibility, foster overall vitality, and aid in natural inflammatory balance.",
    partsUsed: "Rhizome (fresh or dried ground powder)",
    cultivation: "Grows best in warm, humid tropical climates with temperatures between 20°C and 30°C. Requires rich, well-drained loamy soil.",
    image: "https://images.unsplash.com/photo-1615485290176-64c8f041ffaa?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Peppermint / Mint",
    scientificName: "Mentha x piperita",
    category: "Aromatic",
    description: "Mint is a fast-growing aromatic herb renowned for its crisp, cooling fragrance caused by naturally occurring menthol in its emerald leaves.",
    benefits: "Traditionally prepared as tea to refresh the palate, soothe digestion after heavy meals, and provide invigorating aromatic relaxation.",
    partsUsed: "Fresh and dried leaves, essential oil",
    cultivation: "Very easy to grow in containers or gardens. Thrives in moist, well-drained soil in full sun or partial shade. Spread can be vigorous.",
    image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Ashwagandha",
    scientificName: "Withania somnifera",
    category: "Ayurvedic",
    description: "Often referred to as Indian Ginseng, Ashwagandha is an esteemed Rasayana (rejuvenator) in classical Ayurvedic medicine with extensive botanical heritage.",
    benefits: "Traditionally recommended to help manage daily stress, promote restful sleep patterns, and support stamina and cognitive alertness.",
    partsUsed: "Roots and occasionally leaves",
    cultivation: "Thrives in dry, subtropical regions with sandy or light red soil with a pH of 7.5–8.0. Requires minimal water once established.",
    image: "https://images.unsplash.com/photo-1514733670139-4d87a1941d55?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Lemongrass",
    scientificName: "Cymbopogon citratus",
    category: "Aromatic",
    description: "Lemongrass is a tall, perennial, fragrant grass that produces a distinct, crisp citrus scent widely enjoyed in herbal teas and natural wellness products.",
    benefits: "Traditionally brewed as a calming herbal infusion to support digestive comfort, refresh the senses, and act as a gentle natural coolant.",
    partsUsed: "Fleshy stalk bases and tender leaves",
    cultivation: "Requires full sun, high heat, and consistently moist, fertile soil. Sensitive to freezing temperatures; suitable for garden beds or pots.",
    image: "https://images.unsplash.com/photo-1596797882870-8c33deeac224?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Brahmi (Water Hyssop)",
    scientificName: "Bacopa monnieri",
    category: "Ayurvedic",
    description: "Brahmi is a creeping wetland perennial with small succulent leaves, traditionally revered in Ayurvedic literature for mental clarity and focus.",
    benefits: "Traditionally used to promote memory retention, mental calm, concentration, and to soothe a tired mind during intellectual tasks.",
    partsUsed: "Whole aerial herb and succulent leaves",
    cultivation: "Loves wet, marshy, semi-aquatic conditions with moist soil. Ideal for shallow water containers or bog gardens with filtered sunlight.",
    image: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Amla (Indian Gooseberry)",
    scientificName: "Phyllanthus emblica",
    category: "Medicinal",
    description: "Amla is a deciduous tree famed for producing translucent, sour-astringent berries naturally packed with abundant Vitamin C and polyphenols.",
    benefits: "Traditionally used as a potent natural antioxidant to support immune defense, maintain healthy hair roots, and aid general vitality.",
    partsUsed: "Fresh or dried fruits, seeds, and fruit extract",
    cultivation: "Grows well in tropical and subtropical regions. Hardy and adaptable to poor or sodic soils, preferring sunny open areas.",
    image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80"
  }
];

module.exports = samplePlants;
