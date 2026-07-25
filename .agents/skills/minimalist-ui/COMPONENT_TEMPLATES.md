# Component Templates — Minimalist-UI Implementation

Concrete examples of how to structure key landing page components.

---

## 1. Hero Section Template

```jsx
// HeroTop.js (Redesigned)
export default function HeroTop() {
  return (
    <section style={styles.hero}>
      <div style={styles.container}>
        <h1 style={styles.title}>DINO LEXICON</h1>
        <p style={styles.subtitle}>
          Explore 111 dinosaur species across 6 continents 
          through games and quizzes.
        </p>
      </div>
    </section>
  );
}

const styles = {
  hero: {
    backgroundColor: '#FBFBFA',
    paddingTop: '64px',
    paddingBottom: '64px',
    borderBottom: '1px solid #EAEAEA',
    // Optional: subtle radial gradient at opacity: 0.02
  },
  container: {
    maxWidth: '1200px',
    marginX: 'auto',
    paddingX: '40px', // or responsive
    textAlign: 'left',
  },
  title: {
    fontSize: '56px',
    fontFamily: 'Lyon Text, Newsreader, serif',
    fontWeight: '400',
    lineHeight: '1.1',
    letterSpacing: '-0.03em',
    color: '#2F3437',
    marginBottom: '16px',
  },
  subtitle: {
    fontSize: '18px',
    fontFamily: 'Geist Sans, SF Pro Display, sans-serif',
    fontWeight: '400',
    lineHeight: '1.6',
    color: '#787774',
    maxWidth: '600px',
  },
};
```

---

## 2. Primary CTA Button

```jsx
// PrimaryCTA.js (Redesigned)
export default function PrimaryCTA({ onPress }) {
  return (
    <button 
      onClick={onPress}
      style={styles.button}
    >
      Start exploring
    </button>
  );
}

const styles = {
  button: {
    backgroundColor: '#111111',
    color: '#FFFFFF',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '500',
    fontFamily: 'Geist Sans, SF Pro Display, sans-serif',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 200ms ease-out, transform 100ms linear',
    outline: 'none',
  },
  buttonHover: {
    backgroundColor: '#333333',
  },
  buttonActive: {
    transform: 'scale(0.98)',
  },
  buttonFocus: {
    outline: '2px solid #2F3437',
    outlineOffset: '2px',
  },
};
```

---

## 3. Card Component (Bento Grid Item)

```jsx
// Card.js (Reusable)
export default function Card({ 
  title, 
  description, 
  icon, 
  onClick, 
  children 
}) {
  return (
    <div 
      style={styles.card}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    >
      {icon && <div style={styles.icon}>{icon}</div>}
      <h3 style={styles.cardTitle}>{title}</h3>
      {description && <p style={styles.cardDesc}>{description}</p>}
      {children}
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #EAEAEA',
    borderRadius: '8px',
    padding: '32px',
    cursor: 'pointer',
    transition: 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 200ms cubic-bezier(0.16, 1, 0.3, 1)',
    outline: 'none',
  },
  cardHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },
  cardFocus: {
    outline: '2px solid #2F3437',
    outlineOffset: '2px',
  },
  icon: {
    fontSize: '32px',
    marginBottom: '12px',
    // Use Phosphor icon or custom SVG here
  },
  cardTitle: {
    fontSize: '24px',
    fontFamily: 'Geist Sans, SF Pro Display, sans-serif',
    fontWeight: '500',
    lineHeight: '1.2',
    color: '#2F3437',
    marginBottom: '8px',
    marginTop: '0',
  },
  cardDesc: {
    fontSize: '16px',
    fontFamily: 'Geist Sans, SF Pro Display, sans-serif',
    fontWeight: '400',
    lineHeight: '1.6',
    color: '#787774',
    marginTop: '8px',
    marginBottom: '0',
  },
};
```

---

## 4. Game Mode Grid (Bento)

```jsx
// GameGrid.js
const GAMES = [
  {
    title: 'Memory match',
    description: 'Find matching pairs. 3 difficulty levels.',
    icon: '◇', // or <PhosphorIcon name="cards" />
  },
  {
    title: 'Who am I?',
    description: 'Answer 10 questions. Guess the species.',
    icon: '?',
  },
  // ... more games
];

export default function GameGrid() {
  return (
    <section style={styles.section}>
      <h2 style={styles.sectionTitle}>Game modes</h2>
      <div style={styles.grid}>
        {GAMES.map((game, idx) => (
          <Card
            key={idx}
            title={game.title}
            description={game.description}
            icon={game.icon}
          />
        ))}
      </div>
    </section>
  );
}

const styles = {
  section: {
    backgroundColor: '#FBFBFA',
    paddingTop: '64px',
    paddingBottom: '64px',
    borderTop: '1px solid #EAEAEA',
  },
  sectionTitle: {
    fontSize: '40px',
    fontFamily: 'Lyon Text, serif',
    fontWeight: '400',
    lineHeight: '1.15',
    letterSpacing: '-0.02em',
    color: '#2F3437',
    marginBottom: '40px',
    marginTop: '0',
    paddingLeft: '40px',
    paddingRight: '40px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)', // Desktop
    gap: '24px',
    paddingLeft: '40px',
    paddingRight: '40px',
    // Responsive: 
    // '@media (max-width: 1024px)': { gridTemplateColumns: 'repeat(2, 1fr)' },
    // '@media (max-width: 768px)': { gridTemplateColumns: '1fr' },
  },
};
```

---

## 5. Daily Dino Card

```jsx
// DailyDinoCard.js (Redesigned)
export default function DailyDinoCard({ dino, onFlip }) {
  const [flipped, setFlipped] = useState(false);

  const handleFlip = () => {
    setFlipped(!flipped);
    onFlip?.();
  };

  return (
    <section style={styles.section}>
      <h2 style={styles.title}>Today's creature</h2>
      <div 
        style={styles.cardContainer}
        onClick={handleFlip}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleFlip()}
      >
        {!flipped ? (
          <div style={styles.front}>
            <img 
              src={dino.image} 
              alt={`${dino.name} dinosaur illustration`}
              style={styles.image}
            />
            <div style={styles.nameBar}>
              <h3 style={styles.name}>{dino.name}</h3>
              <p style={styles.latin}>{dino.scientificName}</p>
            </div>
          </div>
        ) : (
          <div style={styles.back}>
            <p style={styles.fact}>{dino.fact}</p>
          </div>
        )}
      </div>
      <p style={styles.hint}>Click to {flipped ? 'flip back' : 'reveal fact'}</p>
    </section>
  );
}

const styles = {
  section: {
    paddingTop: '32px',
    paddingBottom: '32px',
  },
  title: {
    fontSize: '24px',
    fontFamily: 'Geist Sans, SF Pro Display, sans-serif',
    fontWeight: '500',
    color: '#2F3437',
    marginBottom: '20px',
    marginTop: '0',
  },
  cardContainer: {
    aspectRatio: '16 / 9',
    backgroundColor: '#FFFFFF',
    border: '1px solid #EAEAEA',
    borderRadius: '8px',
    overflow: 'hidden',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    transition: 'box-shadow 200ms, transform 200ms',
  },
  cardContainerHover: {
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    transform: 'translateY(-1px)',
  },
  front: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  image: {
    flex: 1,
    objectFit: 'cover',
    backgroundColor: '#F9F9F8',
  },
  nameBar: {
    backgroundColor: '#FBF3DB', // Pale amber
    padding: '16px',
  },
  name: {
    fontSize: '18px',
    fontWeight: '500',
    color: '#956400',
    margin: '0 0 4px 0',
  },
  latin: {
    fontSize: '14px',
    fontStyle: 'italic',
    color: '#956400',
    opacity: '0.8',
    margin: '0',
  },
  back: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px',
    backgroundColor: '#F9F9F8',
  },
  fact: {
    fontSize: '16px',
    lineHeight: '1.6',
    color: '#2F3437',
    textAlign: 'center',
    margin: '0',
  },
  hint: {
    fontSize: '12px',
    color: '#A9A6A2',
    marginTop: '12px',
    marginBottom: '0',
    textAlign: 'center',
  },
};
```

---

## 6. Divider / Section Separator

```jsx
// Divider.js (Reusable)
export default function Divider() {
  return <div style={styles.divider} />;
}

const styles = {
  divider: {
    height: '1px',
    backgroundColor: '#EAEAEA',
    margin: '32px 0', // Macro whitespace
    border: 'none',
  },
};
```

---

## 7. Region Map Section

```jsx
// RegionMap.js (Redesigned)
export default function RegionMap({ regions, onSelectRegion }) {
  return (
    <section style={styles.section}>
      <h2 style={styles.title}>Explore by continent</h2>
      <p style={styles.subtitle}>
        Each region has locked species. Unlock them by winning games.
      </p>
      
      <div style={styles.mapContainer}>
        {/* SVG world map or placeholder */}
        <svg style={styles.map} viewBox="0 0 1000 600">
          {/* Map paths */}
        </svg>
        
        {/* Interactive region overlays */}
        {regions.map((region, idx) => (
          <button
            key={idx}
            style={styles.regionButton}
            onClick={() => onSelectRegion(region.id)}
          >
            <span style={styles.regionCount}>{region.count}</span>
            <span style={styles.regionLabel}>{region.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

const styles = {
  section: {
    paddingTop: '64px',
    paddingBottom: '64px',
    borderTop: '1px solid #EAEAEA',
  },
  title: {
    fontSize: '40px',
    fontFamily: 'Lyon Text, serif',
    fontWeight: '400',
    letterSpacing: '-0.02em',
    color: '#2F3437',
    marginBottom: '12px',
  },
  subtitle: {
    fontSize: '16px',
    color: '#787774',
    lineHeight: '1.6',
    marginBottom: '40px',
  },
  mapContainer: {
    position: 'relative',
    backgroundColor: '#FFFFFF',
    border: '1px solid #EAEAEA',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: 'auto',
    minHeight: '400px',
    fill: '#F9F9F8',
    stroke: '#EAEAEA',
  },
  regionButton: {
    position: 'absolute',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    fontSize: '14px',
    outline: 'none',
  },
  regionButtonFocus: {
    outline: '2px solid #2F3437',
  },
  regionCount: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#2F3437',
  },
  regionLabel: {
    fontSize: '12px',
    color: '#787774',
    marginTop: '4px',
  },
};
```

---

## 8. Icon Usage (Phosphor Example)

```jsx
import { Play, Heart, MapPin, ArrowRight } from '@phosphor-icons/react';

// Usage in components:
<Play size={24} weight="bold" color="#2F3437" />
<Heart size={20} weight="regular" color="#FBF3DB" />
<MapPin size={28} weight="bold" color="#1F6C5D" />

// SVG Custom Icon Example (simple geometric):
function DinoHeadIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="10" stroke="#2F3437" strokeWidth="1.5" />
      <path d="M 20 14 L 26 12" stroke="#2F3437" strokeWidth="1.5" />
      <circle cx="14" cy="14" r="1.5" fill="#2F3437" />
    </svg>
  );
}
```

---

## Key Principles Enforced in Templates

✓ No `rounded-full` — use crisp 4–8px radius  
✓ No heavy shadows — only on hover, and ultra-soft (opacity < 0.05)  
✓ No bright/saturated colors — use palette pastels only  
✓ Semantic color usage — pale amber for info, pale red for alerts  
✓ Macro whitespace — 64px section padding, 32px internal  
✓ 1px solid #EAEAEA borders only  
✓ Bento grid layout for feature/game sections  
✓ Serif headings with tight tracking  
✓ Geometric sans for body (Geist Sans / SF Pro)  
✓ No emojis — use Phosphor icons or custom SVG  
✓ Clear, direct copy — no marketing clichés  
✓ Accessible focus rings (2px solid #2F3437)  
✓ Scroll-entry animations with IntersectionObserver  
