import Hero from '../Hero';

export default function HeroExample() {
  return <Hero onSearch={(query) => console.log('Searching for:', query)} />;
}
