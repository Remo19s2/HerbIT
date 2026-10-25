const samplePlants = [
  {
    name: "Tulsi (Holy Basil)",
    scientificName: "Ocimum tenuiflorum",
    category: "Ayurvedic",
    description: "Tulsi is revered in India as the 'Queen of Herbs' and is an essential cornerstone of Ayurvedic wellness traditions. It is recognized for its adaptogenic properties and aromatic foliage.",
    benefits: "Traditionally used to support respiratory health, promote vitality, help soothe seasonal colds, and assist the body in adapting to daily physical stress.",
    partsUsed: "Leaves, seeds, and essential oil extract",
    cultivation: "Thrives in warm, tropical conditions with ample sunlight (at least 6 hours daily). Requires well-draining loamy soil with regular moderate watering.",
    image: "images/plants/tulsi.jpg"
  },
  {
    name: "Neem",
    scientificName: "Azadirachta indica",
    category: "Medicinal",
    description: "Neem is a fast-growing evergreen tree native to the Indian subcontinent, frequently celebrated for its wide array of traditional therapeutic and insect-repelling virtues.",
    benefits: "Commonly used in traditional preparations for skin wellness, oral hygiene maintenance (neem twigs), and natural insect repellent formulations.",
    partsUsed: "Leaves, bark, seeds, and neem oil",
    cultivation: "Drought-tolerant tree that thrives in sub-arid to sub-humid tropical climates. Tolerates various soil types, preferring deep, well-drained sandy soil.",
    image: "images/plants/neem.jpg"
  },
  {
    name: "Aloe Vera",
    scientificName: "Aloe barbadensis miller",
    category: "Medicinal",
    description: "Aloe Vera is a succulent plant species known worldwide for its thick, fleshy leaves containing a soothing, nutrient-dense natural gel.",
    benefits: "Traditionally used topically to soothe minor skin irritations, provide hydration for sunburns, and support skin barrier recovery.",
    partsUsed: "Clear inner leaf gel and leaf latex",
    cultivation: "Requires plenty of bright, indirect sunlight and porous cactus potting mix. Minimal watering needed; allow soil to dry completely between waterings.",
    image: "images/plants/aloe-vera.jpg"
  },
  {
    name: "Ginger",
    scientificName: "Zingiber officinale",
    category: "Common Herbs",
    description: "Ginger is a flowering plant whose pungent, aromatic rhizome is globally prized both as a culinary spice and in folk herbal practices.",
    benefits: "Widely used in traditional brews to ease mild digestive discomfort, soothe temporary nausea, and support warming seasonal comfort.",
    partsUsed: "Underground rhizome (root)",
    cultivation: "Prefers warm, humid, partially shaded environments with rich, loose, humus-rich soil. Requires consistent moisture without waterlogging.",
    image: "images/plants/ginger.jpg"
  },
  {
    name: "Turmeric",
    scientificName: "Curcuma longa",
    category: "Ayurvedic",
    description: "Turmeric is a bright golden-yellow rhizomatous herb belonging to the ginger family, celebrated as a sacred botanical and dietary antioxidant source.",
    benefits: "Contains curcumin, traditionally utilized to support joint flexibility, foster overall vitality, and aid in natural inflammatory balance.",
    partsUsed: "Rhizome (fresh or dried ground powder)",
    cultivation: "Grows best in warm, humid tropical climates with temperatures between 20°C and 30°C. Requires rich, well-drained loamy soil.",
    image: "images/plants/turmeric.jpg"
  },
  {
    name: "Peppermint / Mint",
    scientificName: "Mentha x piperita",
    category: "Aromatic",
    description: "Mint is a fast-growing aromatic herb renowned for its crisp, cooling fragrance caused by naturally occurring menthol in its emerald leaves.",
    benefits: "Traditionally prepared as tea to refresh the palate, soothe digestion after heavy meals, and provide invigorating aromatic relaxation.",
    partsUsed: "Fresh and dried leaves, essential oil",
    cultivation: "Very easy to grow in containers or gardens. Thrives in moist, well-drained soil in full sun or partial shade. Spread can be vigorous.",
    image: "images/plants/mint.jpg"
  },
  {
    name: "Ashwagandha",
    scientificName: "Withania somnifera",
    category: "Ayurvedic",
    description: "Often referred to as Indian Ginseng, Ashwagandha is an esteemed Rasayana (rejuvenator) in classical Ayurvedic medicine with extensive botanical heritage.",
    benefits: "Traditionally recommended to help manage daily stress, promote restful sleep patterns, and support stamina and cognitive alertness.",
    partsUsed: "Roots and occasionally leaves",
    cultivation: "Thrives in dry, subtropical regions with sandy or light red soil with a pH of 7.5–8.0. Requires minimal water once established.",
    image: "images/plants/ashwagandha.jpg"
  },
  {
    name: "Lemongrass",
    scientificName: "Cymbopogon citratus",
    category: "Aromatic",
    description: "Lemongrass is a tall, perennial, fragrant grass that produces a distinct, crisp citrus scent widely enjoyed in herbal teas and natural wellness products.",
    benefits: "Traditionally brewed as a calming herbal infusion to support digestive comfort, refresh the senses, and act as a gentle natural coolant.",
    partsUsed: "Fleshy stalk bases and tender leaves",
    cultivation: "Requires full sun, high heat, and consistently moist, fertile soil. Sensitive to freezing temperatures; suitable for garden beds or pots.",
    image: "images/plants/lemongrass.jpg"
  },
  {
    name: "Brahmi (Water Hyssop)",
    scientificName: "Bacopa monnieri",
    category: "Ayurvedic",
    description: "Brahmi is a creeping wetland perennial with small succulent leaves, traditionally revered in Ayurvedic literature for mental clarity and focus.",
    benefits: "Traditionally used to promote memory retention, mental calm, concentration, and to soothe a tired mind during intellectual tasks.",
    partsUsed: "Whole aerial herb and succulent leaves",
    cultivation: "Loves wet, marshy, semi-aquatic conditions with moist soil. Ideal for shallow water containers or bog gardens with filtered sunlight.",
    image: "images/plants/brahmi.jpg"
  },
  {
    name: "Amla (Indian Gooseberry)",
    scientificName: "Phyllanthus emblica",
    category: "Medicinal",
    description: "Amla is a deciduous tree famed for producing translucent, sour-astringent berries naturally packed with abundant Vitamin C and polyphenols.",
    benefits: "Traditionally used as a potent natural antioxidant to support immune defense, maintain healthy hair roots, and aid general vitality.",
    partsUsed: "Fresh or dried fruits, seeds, and fruit extract",
    cultivation: "Grows well in tropical and subtropical regions. Hardy and adaptable to poor or sodic soils, preferring sunny open areas.",
    image: "images/plants/amla.jpg"
  },
  {
    name: "Curry Leaf",
    scientificName: "Murraya koenigii",
    category: "Aromatic",
    description: "Curry Leaf tree produces highly aromatic pinnate leaves central to South Asian culinary traditions and traditional digestive care.",
    benefits: "Rich in plant antioxidants and essential oils; traditionally used to support healthy digestion, appetite, and hair vitality.",
    partsUsed: "Fresh foliage and leaves",
    cultivation: "Prefers warm sunny conditions and fertile, well-draining loamy soil with moderate watering.",
    image: "images/plants/curry-leaf.jpg"
  },
  {
    name: "Coriander",
    scientificName: "Coriandrum sativum",
    category: "Common Herbs",
    description: "Coriander is a tender annual culinary and medicinal herb whose fresh leaves (cilantro) and dried seeds have been cherished for millennia.",
    benefits: "Traditionally used to aid digestion, promote cooling comfort, and support natural gastrointestinal balance.",
    partsUsed: "Fresh leaves and dried seeds (Dhanyaka)",
    cultivation: "Grows rapidly in full sun to light shade in rich, well-drained soil during temperate or cool seasons.",
    image: "images/plants/coriander.jpg"
  },
  {
    name: "Fenugreek",
    scientificName: "Trigonella foenum-graecum",
    category: "Medicinal",
    description: "Fenugreek is an annual legume cultivated for its aromatic clover-like leaves and fragrant, golden rhombic seeds.",
    benefits: "Traditionally employed to help maintain healthy metabolic and blood sugar balance, assist digestion, and support lactation.",
    partsUsed: "Seeds (Methi) and tender green leaves",
    cultivation: "Prefers full sun and loamy, well-drained soil with neutral pH. Germinates quickly from seed.",
    image: "images/plants/fenugreek.jpg"
  },
  {
    name: "Hibiscus",
    scientificName: "Hibiscus rosa-sinensis",
    category: "Common Herbs",
    description: "Hibiscus is an evergreen shrub boasting vibrant showy flowers, revered in Ayurvedic hair rituals and soothing herbal decoctions.",
    benefits: "Traditionally utilized to condition hair roots, promote a calm cooling sensation, and provide botanical antioxidants.",
    partsUsed: "Vibrant flower petals and tender leaves",
    cultivation: "Requires plenty of direct sunlight, warm humid air, and moist, nutrient-rich, well-drained soil.",
    image: "images/plants/hibiscus.jpg"
  },
  {
    name: "Garlic",
    scientificName: "Allium sativum",
    category: "Common Herbs",
    description: "Garlic is a bulbous perennial herb famed for its pungent sulfurous cloves, holding a venerable place in traditional medicine worldwide.",
    benefits: "Traditionally prized (Rasona) for promoting cardiovascular wellness, maintaining balanced lipid profiles, and supporting natural immunity.",
    partsUsed: "Underground bulb cloves",
    cultivation: "Planted in autumn or early spring in loose, rich, well-drained soil in open full sunlight.",
    image: "images/plants/garlic.jpg"
  },
  {
    name: "Gotu Kola (Mandukaparni)",
    scientificName: "Centella asiatica",
    category: "Ayurvedic",
    description: "Gotu Kola is a creeping perennial with fan-shaped leaves, renowned as a premier Medhya Rasayana (cognitive revitalizer) in Ayurveda.",
    benefits: "Traditionally used to support cognitive function, memory, mental clarity, and tissue revitalization.",
    partsUsed: "Whole herb and fan-shaped leaves",
    cultivation: "Thrives in moist, wet, shaded habitats and rich, boggy soils with plentiful water.",
    image: "images/plants/gotu-kola.jpg"
  },
  {
    name: "Eucalyptus",
    scientificName: "Eucalyptus globulus",
    category: "Aromatic",
    description: "Eucalyptus is a towering aromatic tree whose lanceolate leaves are rich in eucalyptol (cineole), offering an unmistakable invigorating scent.",
    benefits: "Traditionally used in steaming inhalations and balms to promote clear breathing and soothe airway congestion.",
    partsUsed: "Mature leaves and steam-distilled essential oil",
    cultivation: "Fast-growing tree demanding full sun, moderate moisture, and porous soil.",
    image: "images/plants/eucalyptus.jpg"
  },
  {
    name: "Giloy (Guduchi)",
    scientificName: "Tinospora cordifolia",
    category: "Ayurvedic",
    description: "Known as 'Amrita' or the celestial nectar of Ayurveda, Giloy is an extensive climbing shrub with heart-shaped leaves and grooved stems.",
    benefits: "Traditionally considered a premier adaptogen and immunomodulator, supporting resilience against fever and daily oxidative stress.",
    partsUsed: "Mature stems and aerial root decoction",
    cultivation: "Hardy climbing vine that thrives in tropical climates, scaling up trees or sturdy trellises with minimal care.",
    image: "images/plants/giloy.jpg"
  }
];

module.exports = samplePlants;
