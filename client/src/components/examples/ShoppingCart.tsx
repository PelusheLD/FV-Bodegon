import { useState } from 'react';
import ShoppingCart from '../ShoppingCart';
import { Button } from '@/components/ui/button';

export default function ShoppingCartExample() {
  const [isOpen, setIsOpen] = useState(true);
  const [items, setItems] = useState([
    { id: '1', name: 'Coca Cola 2L', price: 3.50, quantity: 2 },
    { id: '2', name: 'Pan Integral', price: 2.00, quantity: 1 },
  ]);

  const handleUpdateQuantity = (id: string, quantity: number) => {
    if (quantity === 0) {
      setItems(items.filter(item => item.id !== id));
    } else {
      setItems(items.map(item => 
        item.id === id ? { ...item, quantity } : item
      ));
    }
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  return (
    <div className="relative h-screen">
      <Button onClick={() => setIsOpen(true)}>Abrir Carrito</Button>
      <ShoppingCart
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        items={items}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={() => console.log('Checkout')}
      />
    </div>
  );
}
