import { memo, useMemo, useRef, useEffect, useState } from 'react';
import { Search, AlertCircle, ShoppingCart } from 'lucide-react';
import { useDebounce } from 'use-debounce';

const categoryBackgrounds = {
  electronics: 'bg-blue-50',
  clothing: 'bg-green-50',
  accessories: 'bg-yellow-50',
  books: 'bg-red-50',
  home: 'bg-purple-50',
  sports: 'bg-orange-50',
  toys: 'bg-pink-50',
  general: 'bg-gray-50',
};

const initialColors = [
  'text-blue-500',
  'text-green-500',
  'text-yellow-500',
  'text-red-500',
  'text-purple-500',
  'text-orange-500',
  'text-pink-500',
  'text-teal-500',
  'text-indigo-500',
  'text-gray-500',
];

const ProductCard = memo(({ product, handleBuy, handleAddToCart }) => {
  const [isBuying, setIsBuying] = useState(false);

  const onBuy = async () => {
    setIsBuying(true);
    try {
      await handleBuy(product.id);
    } finally {
      setIsBuying(false);
    }
  };

  return (
    <div
      className={`product-card rounded-xl shadow-md overflow-hidden flex flex-col transition-transform duration-300  hover:shadow-lg ${
        categoryBackgrounds[product.category?.toLowerCase()] || categoryBackgrounds.general
      }`}
    >
      <div className="p-3 flex-grow">
        <div className="h-20 bg-white flex items-center justify-center rounded-md mb-2 overflow-hidden">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span
              className={`text-2xl font-bold ${product.initialColor}`}
              aria-hidden="true"
            >
              {product.name.charAt(0)}
            </span>
          )}
        </div>
        <div className="mb-2">
          <h3 className="text-sm font-semibold text-gray-800 mb-1 line-clamp-1">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-gray-600 text-xs line-clamp-2">
              {product.description}
            </p>
          )}
        </div>
        <div className="flex justify-between items-end">
          <div>
            <p className="text-base font-bold text-gray-800">
              ${product.unitPrice.toFixed(2)}
            </p>
            <p
              className={`text-xs ${
                product.quantity <= 0
                  ? 'text-red-600'
                  : product.quantity <= product.minStockLevel
                  ? 'text-amber-600'
                  : 'text-green-600'
              }`}
            >
              {product.quantity <= 0
                ? 'Out of Stock'
                : product.quantity <= product.minStockLevel
                ? `Low Stock: ${product.quantity}`
                : `In Stock: ${product.quantity}`}
            </p>
          </div>
        </div>
      </div>
      <div className="p-2 bg-white border-t border-gray-100">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onBuy}
            disabled={product.quantity <= 0 || isBuying}
            className={`px-2 py-1 rounded-md text-xs font-medium flex items-center justify-center ${
              product.quantity <= 0 || isBuying
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
            aria-label={`Buy ${product.name}`}
          >
            {isBuying ? (
              <svg
                className="animate-spin h-4 w-4 mr-1 text-white"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z"
                />
              </svg>
            ) : (
              'Buy Now'
            )}
          </button>
          <button
            onClick={() => handleAddToCart(product.id)}
            disabled={product.quantity <= 0}
            className={`px-2 py-1 rounded-md text-xs font-medium flex items-center justify-center ${
              product.quantity <= 0
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-white border border-blue-600 text-blue-600 hover:bg-blue-50'
            }`}
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingCart className="h-3 w-3 mr-1" />
            Add
          </button>
        </div>
      </div>
    </div>
  );
});

const ProductGrid = memo(
  ({
    products,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    activeCategory,
    setActiveCategory,
    sortOption,
    setSortOption,
    handleBuy,
    handleAddToCart,
  }) => {
    const gridRef = useRef(null);
    const scrollPosition = useRef(0);
    const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
    const [debouncedSearchTerm] = useDebounce(localSearchTerm, 300);

    useEffect(() => {
      setSearchTerm(debouncedSearchTerm);
    }, [debouncedSearchTerm, setSearchTerm]);

    useEffect(() => {
      const grid = gridRef.current;
      if (grid) {
        scrollPosition.current = grid.scrollTop;
      }
    });

    useEffect(() => {
      const grid = gridRef.current;
      if (grid) {
        grid.scrollTop = scrollPosition.current;
      }
    });

    const categories = useMemo(
      () => [
        'all',
        ...new Set(
          products
            .filter((p) => p.category)
            .map((p) => p.category.toLowerCase())
        ),
      ],
      [products]
    );

    const hashCode = (value) => {
      const str = String(value);
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
      }
      return hash;
    };

    const productsWithInitialColors = useMemo(
      () =>
        products.map((product, index) => ({
          ...product,
          initialColor:
            initialColors[Math.abs(hashCode(product.id)) % initialColors.length],
          originalIndex: index,
        })),
      [products]
    );

    const filteredProducts = useMemo(() => {
      return productsWithInitialColors.filter((product) => {
        const matchesSearch =
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (product.description &&
            product.description.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesCategory =
          activeCategory === 'all' ||
          (product.category &&
            product.category.toLowerCase() === activeCategory.toLowerCase());
        return matchesSearch && matchesCategory;
      });
    }, [productsWithInitialColors, searchTerm, activeCategory]);

    const sortedProducts = useMemo(() => {
      const sorted = [...filteredProducts];
      return sorted.sort((a, b) => {
        switch (sortOption) {
          case 'price-low':
            return a.unitPrice - b.unitPrice;
          case 'price-high':
            return b.unitPrice - a.unitPrice;
          case 'name':
            return a.name.localeCompare(b.name);
          case 'stock':
            return b.quantity - a.quantity;
          default:
            return a.originalIndex - b.originalIndex;
        }
      });
    }, [filteredProducts, sortOption]);

    return (
      <div className="mb-12" ref={gridRef}>
        <div className="flex flex-col md:flex-row gap-4 items-center mb-6">
          <div className="relative flex-grow max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search products..."
              value={localSearchTerm}
              onChange={(e) => setLocalSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm transition-all duration-200"
              aria-label="Search products"
            />
          </div>
          <div className="w-full md:w-auto">
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="block w-full md:w-48 pl-3 pr-8 py-2 border border-gray-200 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all duration-200"
              aria-label="Sort products"
            >
              <option value="featured">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name">Name (A-Z)</option>
              <option value="stock">In Stock</option>
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-all duration-200 ${
                activeCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
              aria-label={`Filter by ${category} category`}
            >
              {category}
            </button>
          ))}
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[...Array(10)].map((_, index) => (
              <div
                key={index}
                className="product-card bg-white rounded-xl shadow-md p-3 animate-pulse"
              >
                <div className="h-20 bg-gray-200 rounded-md mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-800 p-6 rounded-xl shadow-md">
            <div className="flex items-center mb-3">
              <AlertCircle className="h-6 w-6 mr-2" />
              <h3 className="font-bold text-lg">Error</h3>
            </div>
            <p className="text-sm">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm transition-all duration-200"
              aria-label="Retry loading products"
            >
              Try Again
            </button>
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-md">
            <Search className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              No products found
            </h3>
            <p className="text-gray-600 text-sm">
              Try adjusting your search or filter criteria
            </p>
            {searchTerm && (
              <button
                onClick={() => setLocalSearchTerm('')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition-all duration-200"
                aria-label="Clear search"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {sortedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                handleBuy={handleBuy}
                handleAddToCart={handleAddToCart}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
);

export default ProductGrid;