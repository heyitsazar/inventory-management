import { useState, useEffect, useCallback, useRef } from 'react';
import eShopService from './services/eShopService';
import ProductGrid from './components/ProductGrid';
import CartSidebar from './components/CartSidebar';
import PurchaseHistorySidebar from './components/PurchaseHistorySidebar'; // New component
import { ToastContainer, toast } from 'react-toastify';
import { ShoppingCart, RefreshCw, History } from 'lucide-react'; // Added History icon
import { v4 as uuidv4 } from 'uuid';
import 'react-toastify/dist/ReactToastify.css';
import logo from '/icon.png';

function App() {
  const scrollPositionRef = useRef(0);
  const mainRef = useRef(null);

  // State declarations first
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [purchaseHistory, setPurchaseHistory] = useState(() =>
    JSON.parse(localStorage.getItem('purchaseHistory')) || []
  );
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState(() =>
    JSON.parse(localStorage.getItem('cartItems')) || []
  );
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortOption, setSortOption] = useState('featured');
  const [purchaseHistoryOpen, setPurchaseHistoryOpen] = useState(false); // New state

  // Scroll handling
  useEffect(() => {
    const handleScroll = () => {
      scrollPositionRef.current = window.scrollY;
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    window.scrollTo(0, scrollPositionRef.current);
  }, [products, purchaseHistory, cartItems]);

  const normalizeProducts = (data) =>
    data.map((item) => ({
      id: item.id,
      name: item.name,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      category: item.category || 'General',
      description: item.description || '',
      minStockLevel: item.minStockLevel || 5,
      imageUrl: item.imageUrl || null,
    }));

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const data = await eShopService.getAllItems();
        const normalizedData = normalizeProducts(data);
        setProducts((prev) => {
          if (JSON.stringify(prev) !== JSON.stringify(normalizedData)) {
            return normalizedData;
          }
          return prev;
        });
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (cartOpen) {
      setCartItems((prevItems) =>
        prevItems.filter((item) => {
          const product = products.find((p) => p.id === item.id);
          if (!product || product.quantity < item.quantity) {
            toast.error(`${item.name} is no longer available in the requested quantity`);
            return false;
          }
          return true;
        })
      );
    }
  }, [cartOpen, products]);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await eShopService.getAllItems();
      setProducts(normalizeProducts(data));
      setError(null);
    } catch (err) {
      setError('Failed to load products. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('purchaseHistory', JSON.stringify(purchaseHistory));
  }, [purchaseHistory]);

  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
  }, [cartItems]);

  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      const data = await eShopService.getAllItems();
      setProducts(normalizeProducts(data));
      setError(null);
    } catch (err) {
      setError('Failed to refresh products.');
      console.error(err);
      toast.error('Failed to refresh products.');
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleBuy = useCallback(
    async (productId) => {
      try {
        const currentScrollY = window.scrollY;
        const productBeforeBuy = products.find((p) => p.id === productId);
        if (!productBeforeBuy || productBeforeBuy.quantity <= 0) {
          toast.error('Sorry, this item is out of stock');
          return;
        }

        const originalProducts = [...products];
        setProducts((prev) =>
          prev.map((p) =>
            p.id === productId ? { ...p, quantity: p.quantity - 1 } : p
          )
        );

        await eShopService.buyItem(productId);

        setPurchaseHistory((prev) => [
          ...prev,
          {
            purchaseId: uuidv4(),
            id: productId,
            name: productBeforeBuy.name,
            unitPrice: productBeforeBuy.unitPrice,
            category: productBeforeBuy.category,
            timestamp: new Date().toISOString(),
            quantity: 1,
            status: 'Completed',
          },
        ]);

        scrollPositionRef.current = currentScrollY;
        window.scrollTo(0, currentScrollY);
      } catch (err) {
        setProducts(originalProducts);
        toast.error('Purchase failed. Please try again.');
        console.error(err);
      }
    },
    [products]
  );

  const handleAddToCart = useCallback(
    (productId) => {
      const productToAdd = products.find((p) => p.id === productId);
      if (!productToAdd || productToAdd.quantity <= 0) {
        toast.error('Sorry, this item is out of stock');
        return;
      }

      setCartItems((prevItems) => {
        const existingItem = prevItems.find((item) => item.id === productId);
        if (existingItem) {
          return prevItems.map((item) =>
            item.id === productId
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        }
        return [
          ...prevItems,
          {
            id: productId,
            name: productToAdd.name,
            price: productToAdd.unitPrice,
            quantity: 1,
          },
        ];
      });

      toast.success('Item added to cart');
    },
    [products]
  );

  const handleRemoveFromCart = useCallback((productId) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.id !== productId)
    );
  }, []);

  const handleCheckout = useCallback(async () => {
    try {
      const currentScrollY = window.scrollY;
      const newPurchases = [];
      const productUpdates = {};

      const unavailableItems = [];
      for (const item of cartItems) {
        const product = products.find((p) => p.id === item.id);
        if (!product || product.quantity < item.quantity) {
          unavailableItems.push(item.name);
        }
      }

      if (unavailableItems.length > 0) {
        toast.error(
          `Some items are no longer available: ${unavailableItems.join(', ')}`
        );
        return;
      }

      for (const item of cartItems) {
        for (let i = 0; i < item.quantity; i++) {
          await eShopService.buyItem(item.id);
        }
        const purchasedProduct = products.find((p) => p.id === item.id);
        newPurchases.push({
          purchaseId: uuidv4(),
          id: item.id,
          name: item.name,
          unitPrice: purchasedProduct?.unitPrice || item.price,
          category: purchasedProduct?.category || 'General',
          timestamp: new Date().toISOString(),
          quantity: item.quantity,
          status: 'Completed',
        });
        productUpdates[item.id] = Math.max(
          0,
          (purchasedProduct?.quantity || 0) - item.quantity
        );
      }

      setPurchaseHistory((prev) => [...prev, ...newPurchases]);
      setProducts((prevProducts) =>
        prevProducts.map((product) =>
          productUpdates[product.id] !== undefined
            ? { ...product, quantity: productUpdates[product.id] }
            : product
        )
      );

      setCartItems([]);
      setCartOpen(false);

      scrollPositionRef.current = currentScrollY;
      window.scrollTo(0, currentScrollY);

      toast.success('Checkout complete! Thank you for your purchase.');
    } catch (err) {
      toast.error('Checkout failed. Please try again.');
      console.error(err);
    }
  }, [cartItems, products]);

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <header className="bg-yellow-100 text-black shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <img src={logo} alt="FlowShop Logo" className="h-12 w-12" />
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  FlowShop
                </h1>
                <p className="text-sm opacity-80">
                  Your Modern E-Commerce Experience
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className={`p-2 rounded-full text-white transition-all duration-200 ${
                  refreshing
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-700'
                }`}
                title="Refresh Products"
                aria-label="Refresh Products"
              >
                <RefreshCw
                  className={`h-6 w-6 ${refreshing ? 'animate-spin' : ''}`}
                />
              </button>
              <button
                onClick={() => setPurchaseHistoryOpen(true)} // New button
                className="relative p-2 bg-blue-500 rounded-full text-white hover:bg-blue-700 transition-all duration-200"
                aria-label={`Open purchase history with ${purchaseHistory.length} items`}
              >
                <History className="h-6 w-6" />
                {purchaseHistory.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {purchaseHistory.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setCartOpen(true)}
                className="relative p-2 bg-blue-500 rounded-full text-white hover:bg-blue-700 transition-all duration-200"
                aria-label={`Open cart with ${
                  cartItems.reduce((count, item) => count + item.quantity, 0)
                } items`}
              >
                <ShoppingCart className="h-6 w-6" />
                {cartItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {cartItems.reduce(
                      (count, item) => count + item.quantity,
                      0
                    )}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>
      <main ref={mainRef} className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <ProductGrid
          products={products}
          loading={loading}
          error={error}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          sortOption={sortOption}
          setSortOption={setSortOption}
          handleBuy={handleBuy}
          handleAddToCart={handleAddToCart}
        />
      </main>
      <PurchaseHistorySidebar
        purchaseHistoryOpen={purchaseHistoryOpen}
        setPurchaseHistoryOpen={setPurchaseHistoryOpen}
        purchaseHistory={purchaseHistory}
        setPurchaseHistory={setPurchaseHistory}
        products={products}
        setProducts={setProducts}
      />
      <CartSidebar
        cartOpen={cartOpen}
        setCartOpen={setCartOpen}
        cartItems={cartItems}
        setCartItems={setCartItems}
        handleRemoveFromCart={handleRemoveFromCart}
        handleCheckout={handleCheckout}
      />
      <footer className="bg-blue-600 text-white shadow-inner mt-12">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:justify-between">
            <div className="mb-8 md:mb-0">
              <h3 className="text-lg font-bold mb-2">FlowShop</h3>
              <p className="text-sm opacity-80">
                Your Modern E-Commerce Experience
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-sm font-semibold mb-3">Shop</h3>
                <ul className="space-y-2">
                  <li>
                    <a
                      href="#"
                      className="text-sm opacity-80 hover:text-blue-200"
                    >
                      All Products
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-sm opacity-80 hover:text-blue-200"
                    >
                      New Arrivals
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-sm opacity-80 hover:text-blue-200"
                    >
                      Featured
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-3">About</h3>
                <ul className="space-y-2">
                  <li>
                    <a
                      href="#"
                      className="text-sm opacity-80 hover:text-blue-200"
                    >
                      Our Story
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-sm opacity-80 hover:text-blue-200"
                    >
                      Contact
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-sm opacity-80 hover:text-blue-200"
                    >
                      Careers
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-3">Support</h3>
                <ul className="space-y-2">
                  <li>
                    <a
                      href="#"
                      className="text-sm opacity-80 hover:text-blue-200"
                    >
                      FAQ
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-sm opacity-80 hover:text-blue-200"
                    >
                      Shipping
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-sm opacity-80 hover:text-blue-200"
                    >
                      Returns
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-blue-400">
            <p className="text-center text-sm opacity-80">
              © 2025 FlowShop. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss={false}
        draggable
        pauseOnHover
        theme="light"
      />
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-fade-in { animation: fadeIn 0.3s ease-out; }
        .animate-slide-in { animation: slideIn 0.5s ease-out; }
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #93c5fd;
          border-radius: 10px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #60a5fa;
        }
      `}</style>
    </div>
  );
}

export default App;