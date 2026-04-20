import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartCount, setCartCount] = useState(0);
  const [cart, setCart] = useState({ items: [], subtotal: 0, itemCount: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const isAddingRef = useRef(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('mall242_cart');
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        setCart(parsed);
        const count = parsed.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
        setCartCount(count);
      } catch (e) {
        console.error('Failed to parse cart:', e);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('mall242_cart', JSON.stringify(cart));
    const count = cart.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
    setCartCount(count);
  }, [cart]);

  // Add item to cart
  const addToCart = useCallback((product, quantity = 1, variant = null) => {
    // Prevent multiple rapid clicks
    if (isAddingRef.current) return;
    isAddingRef.current = true;
    
    setTimeout(() => {
      isAddingRef.current = false;
    }, 300);

    // Get product ID (handle both _id and id)
    const productId = product._id || product.id;
    if (!productId) {
      console.error('Product has no ID:', product);
      return;
    }

    const productName = product.name || 'Product';
    const productPrice = product.discountedPrice || product.price;
    const productOriginalPrice = product.price;
    const productImage = product.images?.[0]?.url || product.image;
    const productSlug = product.slug;

    setCart(prevCart => {
      const existingItemIndex = prevCart.items?.findIndex(
        item => item.id === productId && 
        JSON.stringify(item.variant) === JSON.stringify(variant)
      ) ?? -1;

      let newItems;
      if (existingItemIndex > -1) {
        // Update existing item
        newItems = [...prevCart.items];
        newItems[existingItemIndex] = {
          ...newItems[existingItemIndex],
          quantity: newItems[existingItemIndex].quantity + quantity
        };
      } else {
        // Add new item
        const newItem = {
          id: productId,
          name: productName,
          price: productPrice,
          originalPrice: productOriginalPrice,
          image: productImage,
          slug: productSlug,
          brand: product.brand,
          quantity: quantity,
          variant: variant,
          inStock: product.quantity || 99,
          isPrime: product.isPrime || false,
        };
        newItems = [...(prevCart.items || []), newItem];
      }

      // Calculate new subtotal
      const newSubtotal = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const newItemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);

      return {
        items: newItems,
        subtotal: newSubtotal,
        itemCount: newItemCount,
      };
    });
  }, []);

  // Remove item from cart
  const removeFromCart = useCallback((itemId, variant = null) => {
    setCart(prevCart => {
      const newItems = prevCart.items.filter(item => 
        !(item.id === itemId && JSON.stringify(item.variant) === JSON.stringify(variant))
      );
      
      const newSubtotal = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const newItemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);

      return {
        items: newItems,
        subtotal: newSubtotal,
        itemCount: newItemCount,
      };
    });
  }, []);

  // Update item quantity
  const updateQuantity = useCallback((itemId, quantity, variant = null) => {
    if (quantity < 1) {
      removeFromCart(itemId, variant);
      return;
    }
    
    setCart(prevCart => {
      const newItems = prevCart.items.map(item =>
        item.id === itemId && JSON.stringify(item.variant) === JSON.stringify(variant)
          ? { ...item, quantity }
          : item
      );
      
      const newSubtotal = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const newItemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);

      return {
        items: newItems,
        subtotal: newSubtotal,
        itemCount: newItemCount,
      };
    });
  }, [removeFromCart]);

  // Clear entire cart
  const clearCart = useCallback(() => {
    setCart({ items: [], subtotal: 0, itemCount: 0 });
  }, []);

  // Refresh cart (sync with backend if needed)
  const refreshCart = useCallback(async () => {
    // This can be implemented to sync with backend
    // For now, just return the current cart
    return cart;
  }, [cart]);

  return (
    <CartContext.Provider
      value={{
        cartCount,
        cart,
        cartItems: cart.items,
        cartTotal: cart.subtotal,
        isLoading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export default CartProvider;