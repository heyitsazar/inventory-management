import { memo, useMemo, useState, useRef } from 'react';
import { ShoppingCart, X } from 'lucide-react';
import store from '../optimizedStore';

const CartSidebar = memo(
  ({ cartOpen, setCartOpen, cartItems, handleRemoveFromCart, handleCheckout }) => {
    const [processingItems, setProcessingItems] = useState({});
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const cartRef = useRef(null);

    const { cartTotal, cartItemCount } = useMemo(() => {
      const total = cartItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      const count = cartItems.reduce((sum, item) => sum + item.quantity, 0);
      return { cartTotal: total, cartItemCount: count };
    }, [cartItems]);

    const closeCart = () => {
      if (isCheckingOut) return;
      setCartOpen(false);
    };

    const handleDecreaseQuantity = (itemId, quantity) => {
      if (processingItems[itemId] || isCheckingOut) return;

      setProcessingItems((prev) => ({ ...prev, [itemId]: true }));

      const state = store.getState();
      if (quantity > 1) {
        store.setState({
          cartItems: state.cartItems.map((item) =>
            item.id === itemId
              ? { ...item, quantity: item.quantity - 1 }
              : item
          ),
        });
      } else {
        handleRemoveFromCart(itemId);
      }

      setTimeout(() => {
        setProcessingItems((prev) => ({ ...prev, [itemId]: false }));
      }, 300);
    };

    const handleIncreaseQuantity = (itemId) => {
      if (processingItems[itemId] || isCheckingOut) return;

      setProcessingItems((prev) => ({ ...prev, [itemId]: true }));

      const state = store.getState();
      const product = state.products?.find((p) => p.id === itemId);
      const currentItem = state.cartItems.find((i) => i.id === itemId);

      if (product && currentItem && currentItem.quantity >= product.quantity) {
        setTimeout(() => {
          setProcessingItems((prev) => ({ ...prev, [itemId]: false }));
        }, 300);
        return;
      }

      store.setState({
        cartItems: state.cartItems.map((item) =>
          item.id === itemId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ),
      });

      setTimeout(() => {
        setProcessingItems((prev) => ({ ...prev, [itemId]: false }));
      }, 300);
    };

    const handleCheckoutWithTransition = async () => {
      if (isCheckingOut) return;

      setIsCheckingOut(true);
      try {
        await handleCheckout();
      } finally {
        setTimeout(() => {
          setIsCheckingOut(false);
        }, 500);
      }
    };

    if (!cartOpen) {
      return null;
    }

    return (
      <div className="fixed inset-0 overflow-hidden z-50" role="dialog" aria-modal="true">
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0 bg-gray-900 bg-opacity-50 transition-opacity"
            onClick={closeCart}
            aria-hidden="true"
          ></div>
          <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
            <div className="w-screen max-w-md">
              <div
                ref={cartRef}
                className="h-full flex flex-col bg-white shadow-2xl animate-slide-in"
              >
                <div className="flex-1 py-6 overflow-y-auto px-4 sm disclosing:6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                      <ShoppingCart className="h-6 w-6 mr-2 text-blue-600" />
                      Your Cart
                      <span className="ml-2 text-blue-600 text-sm font-medium">
                        ({cartItemCount}{' '}
                        {cartItemCount === 1 ? 'item' : 'items'})
                      </span>
                    </h2>
                    <button
                      onClick={closeCart}
                      disabled={isCheckingOut}
                      className={`p-2 rounded-full text-gray-400 hover:text-gray-600 transition-all duration-200 ${
                        isCheckingOut ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      aria-label="Close cart"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                  <div className="mt-8">
                    {cartItems.length === 0 ? (
                      <div className="text-center py-12">
                        <ShoppingCart className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          Your cart is empty
                        </h3>
                        <p className="mt-2 text-sm text-gray-500">
                          Add items to your cart to get started
                        </p>
                        <button
                          onClick={closeCart}
                          className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200"
                          aria-label="Continue shopping"
                        >
                          Continue Shopping
                        </button>
                      </div>
                    ) : (
                      <ul className="divide-y divide-gray-200">
                        {cartItems.map((item) => (
                          <li
                            key={item.id}
                            className={`py-6 flex ${
                              processingItems[item.id]
                                ? 'opacity-70'
                                : 'opacity-100'
                            } transition-opacity duration-200`}
                          >
                            <div className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-blue-100 flex items-center justify-center">
                              <span
                                className="text-2xl text-blue-500 font-bold"
                                aria-hidden="true"
                              >
                                {item.name.charAt(0)}
                              </span>
                            </div>
                            <div className="ml-4 flex-1 flex flex-col">
                              <div>
                                <div className="flex justify-between text-base font-semibold text-gray-900">
                                  <h3 className="line-clamp-1">
                                    {item.name}
                                  </h3>
                                  <p className="ml-4">
                                    ${(item.price * item.quantity).toFixed(2)}
                                  </p>
                                </div>
                                <p className="mt-1 text-sm text-gray-500">
                                  Unit: ${item.price.toFixed(2)}
                                </p>
                              </div>
                              <div className="flex-1 flex items-end justify-between text-sm">
                                <div className="flex items-center space-x-3">
                                  <button
                                    onClick={() =>
                                      handleDecreaseQuantity(
                                        item.id,
                                        item.quantity
                                      )
                                    }
                                    disabled={
                                      processingItems[item.id] || isCheckingOut
                                    }
                                    className={`px-3 py-1 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition-all duration-200 ${
                                      processingItems[item.id] || isCheckingOut
                                        ? 'opacity-50 cursor-not-allowed'
                                        : ''
                                    }`}
                                    aria-label={`Decrease quantity of ${item.name}`}
                                  >
                                    -
                                  </button>
                                  <span className="font-medium">
                                    {item.quantity}
                                  </span>
                                  <button
                                    onClick={() =>
                                      handleIncreaseQuantity(item.id)
                                    }
                                    disabled={
                                      processingItems[item.id] || isCheckingOut
                                    }
                                    className={`px-3 py-1 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition-all duration-200 ${
                                      processingItems[item.id] || isCheckingOut
                                        ? 'opacity-50 cursor-not-allowed'
                                        : ''
                                    }`}
                                    aria-label={`Increase quantity of ${item.name}`}
                                  >
                                    +
                                  </button>
                                </div>
                                <button
                                  onClick={() => handleRemoveFromCart(item.id)}
                                  disabled={
                                    processingItems[item.id] || isCheckingOut
                                  }
                                  className={`font-medium text-blue-600 hover:text-blue-700 transition-all duration-200 ${
                                    processingItems[item.id] || isCheckingOut
                                      ? 'opacity-50 cursor-not-allowed'
                                      : ''
                                  }`}
                                  aria-label={`Remove ${item.name} from cart`}
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                {cartItems.length > 0 && (
                  <div className="border-t border-gray-200 py-6 px-4 sm:px-6">
                    <div className="flex justify-between text-lg font-semibold text-gray-900">
                      <p>Subtotal</p>
                      <p>${cartTotal.toFixed(2)}</p>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      Shipping and taxes calculated at checkout.
                    </p>
                    <div className="mt-6">
                      <button
                        onClick={handleCheckoutWithTransition}
                        disabled={isCheckingOut}
                        className={`w-full flex justify-center items-center px-6 py-3 rounded-lg text-base font-medium text-white transition-all duration-200 ${
                          isCheckingOut
                            ? 'bg-blue-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                        aria-label="Proceed to checkout"
                      >
                        {isCheckingOut ? (
                          <>
                            <svg
                              className="animate-spin h-5 w-5 mr-3 text-white"
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
                            Processing...
                          </>
                        ) : (
                          'Checkout'
                        )}
                      </button>
                    </div>
                    <div className="mt-6 flex justify-center text-sm text-gray-500">
                      <p>
                        or{' '}
                        <button
                          type="button"
                          className={`text-blue-600 font-medium hover:text-blue-700 transition-all duration-200 ${
                            isCheckingOut
                              ? 'opacity-50 cursor-not-allowed'
                              : ''
                          }`}
                          onClick={closeCart}
                          disabled={isCheckingOut}
                          aria-label="Continue shopping"
                        >
                          Continue Shopping
                          <span aria-hidden="true"> →</span>
                        </button>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default CartSidebar;