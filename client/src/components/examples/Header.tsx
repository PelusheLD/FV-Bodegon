import Header from '../Header';

export default function HeaderExample() {
  return (
    <Header 
      cartCount={3} 
      cartTotal={45.50}
      onCartClick={() => console.log('Cart clicked')}
      onMenuClick={() => console.log('Menu clicked')}
    />
  );
}
